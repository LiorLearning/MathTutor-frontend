'use client'

import { useStore } from '@nanostores/react';
import type { Message } from 'ai';
import { useChat } from 'ai/react';
import { easeInOut, useAnimate } from 'framer-motion';
import { memo, useEffect, useRef, useState } from 'react';
import { cssTransition, toast, ToastContainer } from 'react-toastify';
import { useMessageParser, usePromptEnhancer, useShortcuts, useSnapScroll } from '@/components/bolt/lib/hooks';
import { useChatHistory } from '@/components/bolt/lib/persistence';
import { chatStore } from '@/components/bolt/lib/stores/chat';
import { workbenchStore } from '@/components/bolt/lib/stores/workbench';
import { fileModificationsToHTML } from '@/components/bolt/utils/diff';
import { createScopedLogger, renderLogger } from '@/components/bolt/utils/logger';
import { BaseChat } from './BaseChat';

const toastAnimation = cssTransition({
  enter: 'animated fadeInRight',
  exit: 'animated fadeOutRight',
});

const logger = createScopedLogger('Chat');

export function Chat() {
  renderLogger.trace('Chat');
  logger.info('Rendering Chat component');

  // const { ready, initialMessages, storeMessageHistory } = useChatHistory();
  const initialMessages: Message[] = [];
  logger.debug('Initial messages:', initialMessages);

  return (
    <>
      {/* <p>{JSON.stringify(initialMessages)}</p> */}
      <ChatImpl initialMessages={initialMessages} storeMessageHistory={async (msg: Message[]) => {}} />
      <ToastContainer
        closeButton={({ closeToast }) => {
          return (
            <button className="Toastify__close-button" onClick={closeToast}>
              <div className="i-ph:x text-lg" />
            </button>
          );
        }}
        icon={({ type }) => {
          /**
           * @todo Handle more types if we need them. This may require extra color palettes.
           */
          switch (type) {
            case 'success': {
              return <div className="i-ph:check-bold text-bolt-elements-icon-success text-2xl" />;
            }
            case 'error': {
              return <div className="i-ph:warning-circle-bold text-bolt-elements-icon-error text-2xl" />;
            }
          }

          return undefined;
        }}
        position="bottom-right"
        pauseOnFocusLoss
        transition={toastAnimation}
      />
    </>
  );
}

interface ChatProps {
  initialMessages: Message[];
  storeMessageHistory: (messages: Message[]) => Promise<void>;
}

export const ChatImpl = memo(({ initialMessages, storeMessageHistory }: ChatProps) => {
  logger.info('Initializing ChatImpl component');
  useShortcuts();
  logger.debug('Shortcuts initialized');

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  logger.debug('Textarea ref created');

  const [chatStarted, setChatStarted] = useState(initialMessages.length > 0);
  logger.debug('Chat started state:', chatStarted);

  const { showChat } = useStore(chatStore);
  logger.debug('Show chat state from store:', showChat);

  const [animationScope, animate] = useAnimate();
  logger.debug('Animation scope and animate function initialized');

  const { messages, isLoading, input, handleInputChange, setInput, stop, append } = useChat({
    api: `${process.env.NEXT_PUBLIC_API_BASE_URL}api/chat`,
    onError: (error) => {
      logger.error('Request failed\n\n', error);
      toast.error('There was an error processing your request');
    },
    onFinish: () => {
      logger.debug('Finished streaming');
    },
    initialMessages,
  });
  logger.debug('Chat hook initialized with messages:', messages);

  const { enhancingPrompt, promptEnhanced, enhancePrompt, resetEnhancer } = usePromptEnhancer();
  logger.debug('Prompt enhancer initialized');

  const { parsedMessages, parseMessages } = useMessageParser();
  logger.debug('Message parser initialized');

  const TEXTAREA_MAX_HEIGHT = chatStarted ? 400 : 200;
  logger.debug('Textarea max height set to:', TEXTAREA_MAX_HEIGHT);

  useEffect(() => {
    chatStore.setKey('started', initialMessages.length > 0);
    logger.info('Chat store started key set');
  }, [initialMessages.length]);

  useEffect(() => {
    logger.info('Messages updated:', messages);
    parseMessages(messages, isLoading);
    logger.debug('Messages parsed');

    if (messages.length > initialMessages.length) {
      storeMessageHistory(messages).catch((error) => {
        logger.error('Error storing message history:', error);
        toast.error(error.message);
      });
    }
  }, [messages, isLoading, parseMessages]);

  const scrollTextArea = () => {
    const textarea = textareaRef.current;
    logger.debug('Scrolling textarea');

    if (textarea) {
      textarea.scrollTop = textarea.scrollHeight;
      logger.debug('Textarea scrolled to bottom');
    }
  };

  const abort = () => {
    logger.info('Aborting chat');
    stop();
    chatStore.setKey('aborted', true);
    workbenchStore.abortAllActions();
  };

  useEffect(() => {
    const textarea = textareaRef.current;
    logger.debug('Adjusting textarea height');

    if (textarea) {
      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;
      textarea.style.height = `${Math.min(scrollHeight, TEXTAREA_MAX_HEIGHT)}px`;
      textarea.style.overflowY = scrollHeight > TEXTAREA_MAX_HEIGHT ? 'auto' : 'hidden';
      logger.debug('Textarea height adjusted');
    }
  }, [input, textareaRef]);

  const runAnimation = async () => {
    logger.info('Running animation');
    if (chatStarted) {
      logger.debug('Chat already started, skipping animation');
      return;
    }

    await Promise.all([
      animate('#examples', { opacity: 0, display: 'none' }, { duration: 0.1 }),
      animate('#intro', { opacity: 0, flex: 1 }, { duration: 0.2, ease: easeInOut }),
    ]);

    chatStore.setKey('started', true);
    setChatStarted(true);
    logger.debug('Animation completed and chat started');
  };

  const sendMessage = async (_event: React.UIEvent, messageInput?: string) => {
    const _input = messageInput || input;
    logger.info('Sending message:', _input);

    if (_input.length === 0 || isLoading) {
      logger.warn('Input is empty or chat is loading, aborting send');
      return;
    }

    await workbenchStore.saveAllFiles();
    logger.debug('All files saved');

    const fileModifications = workbenchStore.getFileModifcations();
    logger.debug('File modifications:', fileModifications);

    chatStore.setKey('aborted', false);
    runAnimation();

    if (fileModifications !== undefined) {
      const diff = fileModificationsToHTML(fileModifications);
      logger.debug('File modifications diff:', diff);

      append({ role: 'user', content: `${diff}\n\n${_input}` });
      workbenchStore.resetAllFileModifications();
      logger.debug('File modifications reset');
    } else {
      append({ role: 'user', content: _input });
    }

    setInput('');
    resetEnhancer();
    textareaRef.current?.blur();
    logger.info('Message sent and input reset');
  };

  const [messageRef, scrollRef] = useSnapScroll();
  logger.debug('Snap scroll initialized');

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
