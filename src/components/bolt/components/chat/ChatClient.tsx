'use client'

import { useStore } from '@nanostores/react';
import type { Message } from 'ai';
import { useChat } from 'ai/react';
import { useAnimate } from 'framer-motion';
import { memo, useEffect, useRef, useState } from 'react';
import { useMessageParser, usePromptEnhancer, useShortcuts, useSnapScroll } from '@/components/bolt/lib/hooks';
import { chatStore } from '@/components/bolt/lib/stores/chat';
import { workbenchStore } from '@/components/bolt/lib/stores/workbench';
import { fileModificationsToHTML } from '@/components/bolt/utils/diff';
import { createScopedLogger, renderLogger } from '@/components/bolt/utils/logger';
import { BaseChat } from './BaseChat';

const logger = createScopedLogger('Chat');

export function Chat() {
  renderLogger.trace('Chat');
  logger.info('Rendering Chat component');

  const initialMessages: Message[] = [];

  return (
    <>
      <ChatImpl initialMessages={initialMessages} />
    </>
  );
}

interface ChatProps {
  initialMessages: Message[];
  storeMessageHistory?: (messages: Message[]) => Promise<void>;
}

const ChatImpl = memo(({ initialMessages, storeMessageHistory }: ChatProps) => {
  useShortcuts();

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [chatStarted, setChatStarted] = useState(initialMessages.length > 0);

  const { showChat } = useStore(chatStore);

  const [animationScope] = useAnimate();

  const messageCount = useRef(0);

  const { messages, isLoading, input, handleInputChange, setInput, stop, reload, setMessages } = useChat({
    api: `${process.env.NEXT_PUBLIC_API_BASE_URL}api/v1/bolt/chat`,
    // api: `http://localhost:5173/api/chat`,
    onError: (error) => {
      console.log('There was an error processing your request: ', error);
    },
    onFinish: () => {},
    initialMessages,
  });

  const { enhancingPrompt, promptEnhanced, enhancePrompt, resetEnhancer } = usePromptEnhancer();

  const { parsedMessages, parseMessages } = useMessageParser();

  const TEXTAREA_MAX_HEIGHT = chatStarted ? 400 : 200;

  useEffect(() => {
    chatStore.setKey('started', initialMessages.length > 0);
  }, [initialMessages.length]);

  useEffect(() => {
    parseMessages(messages, isLoading);

    if (storeMessageHistory && messages.length > initialMessages.length) {
      storeMessageHistory(messages).catch((error) => {
        console.error('Error storing message history:', error);
      });
    }
  }, [messages, isLoading, parseMessages]);

  const scrollTextArea = () => {
    const textarea = textareaRef.current;

    if (textarea) {
      textarea.scrollTop = textarea.scrollHeight;
    }
  };

  const abort = () => {
    stop();
    chatStore.setKey('aborted', true);
    workbenchStore.abortAllActions();
  };

  useEffect(() => {
    const textarea = textareaRef.current;

    if (textarea) {
      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;
      textarea.style.height = `${Math.min(scrollHeight, TEXTAREA_MAX_HEIGHT)}px`;
      textarea.style.overflowY = scrollHeight > TEXTAREA_MAX_HEIGHT ? 'auto' : 'hidden';
    }
  }, [input, textareaRef]);

  const runAnimation = async () => {
    if (chatStarted) {
      return;
    }

    chatStore.setKey('started', true);
    setChatStarted(true);
  };

  const sendMessage = async (_event: React.UIEvent, messageInput?: string) => {
    const parsedGameFiles = workbenchStore.getParsedGameFiles();

    const _input = `${messageInput || input}\n${parsedGameFiles}`;

    if (_input.length === 0 || isLoading) {
      return;
    }

    await workbenchStore.saveAllFiles();

    const fileModifications = workbenchStore.getFileModifcations();

    chatStore.setKey('aborted', false);
    runAnimation();

    console.log('fileModifications', fileModifications);
    console.log('input', _input);

    if (fileModifications !== undefined) {
      const diff = fileModificationsToHTML(fileModifications);

      setMessages([{ role: 'user', content: `${diff}\n\n${_input}`, id: `user-message-${messageCount.current}` }]);
      workbenchStore.resetAllFileModifications();
    } else {
      setMessages([{ role: 'user', content: _input, id: `user-message-${messageCount.current}` }]);
    }
    messageCount.current++;

    reload();
    setInput('');
    resetEnhancer();
    textareaRef.current?.blur();
  };

  const [messageRef, scrollRef] = useSnapScroll();

  return (
    <BaseChat
      ref={animationScope}
      textareaRef={textareaRef}
      input={input}
      showChat={showChat}
      chatStarted={chatStarted}
      isStreaming={isLoading}
      enhancingPrompt={enhancingPrompt}
      promptEnhanced={promptEnhanced}
      sendMessage={sendMessage}
      messageRef={messageRef}
      scrollRef={scrollRef}
      handleInputChange={handleInputChange}
      handleStop={abort}
      messages={messages.map((message, i) => {
        if (message.role === 'user') {
          return message;
        }

        return {
          ...message,
          content: parsedMessages[i] || '',
        };
      })}
      enhancePrompt={() => {
        enhancePrompt(input, (input) => {
          setInput(input);
          scrollTextArea();
        });
      }}
    />
  );
});

ChatImpl.displayName = 'ChatImpl'

export { ChatImpl }