// src/contexts/WebSocketContext.tsx
import React, { createContext, useContext, useRef, useState, useCallback } from 'react';
import { Message, extractTextFromMessage } from './chat_utils';
import { AudioContext } from './audio/eleven_labs_audio_stream';
import { 
  STOP, 
  END,
  CORRECTION, 
  INTERRUPT, 
  ASSISTANT, 
  USER, 
  PAUSE, 
  NOTEXT, 
  GENERATING_IMAGE, 
  RETHINKING_MESSAGE,
  getDeviceType,
  ANDROID_PHONE,
  ANDROID_TABLET,
  IPHONE,
  IPAD,
  MAC,
} from '../common_utils';

const deviceType = getDeviceType();

interface WebSocketContextType {
  chatWebsocketRef: React.MutableRefObject<WebSocket | null>;
  isChatConnected: boolean;
  isSendingMessage: boolean;
  isGeneratingImage: boolean;
  initChatWebSocket: (username: string, speak?: boolean) => Promise<void>;
  sendStopMessage: () => void;
  handleSendMessage: (message: Blob | string) => Promise<void>;
  toggleAudio: (message: Message) => Promise<void>;
  onSendTextMessage: (message: string) => Promise<void>;
  toggleSpeakout: () => void;
  speakout: boolean;
  isLastMessagePauseRef: React.MutableRefObject<boolean>;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

const SPEED = 
  deviceType === IPHONE || deviceType === ANDROID_PHONE || 
  deviceType === IPAD || deviceType === ANDROID_TABLET 
    ? 15
    : deviceType === MAC 
    ? 30 : 15

const SLEEP_TIME_AFTER_MESSAGE = 1000;

interface WebSocketProviderProps {
  children: React.ReactNode;
  sessionId: string;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setShowPopup: React.Dispatch<React.SetStateAction<boolean>>;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ 
  children, 
  sessionId, 
  setMessages,
  setShowPopup 
}) => {
  const chatWebsocketRef = useRef<WebSocket | null>(null);
  const [isChatConnected, setIsChatConnected] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [speakout, setSpeakout] = useState(true);
  const messageStreamIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isLastMessagePauseRef = useRef<boolean>(false);
  const lastAssistantMessageRef = useRef<Message | null>(null);
  const audioContext = useContext(AudioContext);
  if (!audioContext) {
    throw new Error('MessageCard must be used within an AudioProvider');
  }

  const toggleSpeakout = () => {
    setSpeakout(prev => !prev);
  };

  // Text to Speech functions
  const handleStopAudio = (message: Message) => {
    audioContext.stopAudio(message.message_id);
  };

  const handlePlayAudio = (messageId: string, messageText: string) => {
    if (!messageText.trim()) {
      return;
    }

    messageText = extractTextFromMessage(messageText);

    setMessages(prevMessages => 
      prevMessages.map(msg => 
        msg.message_id === messageId
          ? { ...msg, isPlaying: true }
          : { ...msg, isPlaying: false }
      )
    );

    audioContext.playAudio(messageId, messageText);
  };

  const toggleAudio = useCallback(async (message: Message) => {
    if (message.audioUrl) {
      console.error("Not implemented error");
    } else {
      const isPlaying = message.isPlaying;

      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.message_id === message.message_id 
            ? { ...msg, isPlaying: !isPlaying }
            : msg
        )
      );

      if (isPlaying) {
        handleStopAudio(message);
      } else {
        handlePlayAudio(message.message_id, message.content);
      }
    }
  }, []);


  const initChatWebSocket = useCallback(async (username: string, speak: boolean = false) => {
    if (!chatWebsocketRef.current) {
      chatWebsocketRef.current = new WebSocket(
        `${process.env.NEXT_PUBLIC_WS_BASE_URL}/chat/${username}/${sessionId}/handle_chat`
      );

      chatWebsocketRef.current.onopen = () => {
        setIsChatConnected(true);
        console.log("Chat WebSocket connection established");
      };

      chatWebsocketRef.current.onerror = (error) => {
        console.error("Chat WebSocket error:", error);
        setIsChatConnected(false);
      };

      chatWebsocketRef.current.onclose = () => {
        console.log("Chat WebSocket connection closed");
        setIsChatConnected(false);
      };

      chatWebsocketRef.current.onmessage = async (event) => {
        const data = JSON.parse(event.data);
        const message = data.content;
        const role = data.role;

        switch (role) {
          case NOTEXT:
            setIsSendingMessage(false);
            return;

          case STOP:
            handleStopMessage();
            return;

          case END:
            setShowPopup(true);
            return;

          case PAUSE:
            isLastMessagePauseRef.current = true;
            setMessages(prevMessages => {
              if (prevMessages[prevMessages.length - 1]?.role === ASSISTANT) {
                lastAssistantMessageRef.current = prevMessages[prevMessages.length - 1];
                return prevMessages.slice(0, -1);
              }
              return prevMessages;
            });
            setMessages(prevMessages => [
              ...prevMessages,
              { 
                role: ASSISTANT, 
                content: RETHINKING_MESSAGE,
                message_id: `bot-${Date.now()}`, 
                timestamp: new Date().toISOString(),
                audioUrl: '' 
              }
            ]);
            return;

          case USER:
            const userMessage: Message = {
              role: USER,
              content: message,
              audioUrl: '',
              message_id: `temp-${Date.now()}`,
              timestamp: new Date().toISOString()
            };
            setMessages(prevMessages => [...prevMessages, userMessage]);
            return;

          case INTERRUPT:
            audioContext.stopAudio();
            return;

          case GENERATING_IMAGE:
            if (message === "start") {
              setIsGeneratingImage(true);
            } else if (message === "done") {
              setIsGeneratingImage(false);
            }
            return;
            
          case CORRECTION:
            setMessages(prevMessages => prevMessages.slice(0, -1));
            isLastMessagePauseRef.current = false;
            break;

          case ASSISTANT:
            break

          default:
            console.error("Unknown role received:", role);
            break;
        }

        const isImage = /!\[.*?\]\(.*?\)/.test(message);
        setIsSendingMessage(false);
        await new Promise(resolve => setTimeout(resolve, SLEEP_TIME_AFTER_MESSAGE));

        const finalMessage: Message = {
          role: ASSISTANT,
          content: '',
          audioUrl: '',
          message_id: `bot-${Date.now()}`,
          timestamp: new Date().toISOString(),
          isPlaying: speak,
          isImage: isImage
        };

        if (speak && !isLastMessagePauseRef.current) {
          handlePlayAudio(finalMessage.message_id, message);
        }

        
        if (messageStreamIntervalRef.current) {
          clearInterval(messageStreamIntervalRef.current);
        }

        const streamMessage = (fullMessage: string) => {
          const messageChunks = fullMessage.split(' ');
          let index = 0;
          messageStreamIntervalRef.current = setInterval(() => {
            if (isLastMessagePauseRef.current) {
              clearInterval(messageStreamIntervalRef.current!);
              messageStreamIntervalRef.current = null; 
              return;
            }

            if (index < messageChunks.length) {
              finalMessage.content += messageChunks[index++] + ' ';
              setMessages(prevMessages => {
                const updatedMessages = prevMessages.filter(msg => msg.message_id !== finalMessage.message_id);
                return [...updatedMessages, finalMessage];
              });
            } else {
              clearInterval(messageStreamIntervalRef.current!);
              messageStreamIntervalRef.current = null; 
            }
          }, SPEED);
        };
        streamMessage(message);
      };
    }
  }, [speakout, audioContext, setMessages]);

  const handleStopMessage = () => {
    setIsGeneratingImage(false);
    setIsSendingMessage(false);

    setMessages(prevMessages => {
      const updatedMessages = [...prevMessages];
      if (isLastMessagePauseRef.current && lastAssistantMessageRef.current) {
        updatedMessages.pop(); // Remove the rethinking message
        updatedMessages.push(lastAssistantMessageRef.current); // Add the older message back
        isLastMessagePauseRef.current = false;
        lastAssistantMessageRef.current = null;
      }
      return updatedMessages;
    });
  };

  const sendStopMessage = () => {
    if (chatWebsocketRef.current?.readyState === WebSocket.OPEN) {
      chatWebsocketRef.current.send(STOP);
      chatWebsocketRef.current.send(STOP);
      handleStopMessage();
    }
  };

  const handleSendMessage = useCallback(async (message: Blob | string) => {
    if (chatWebsocketRef.current?.readyState === WebSocket.OPEN) {
      chatWebsocketRef.current.send(message);
    }

    audioContext.stopAudio();

    setIsSendingMessage(true);
  }, []);

  const onSendTextMessage = async (message: string) => {
    // Dummy message
    if (chatWebsocketRef.current?.readyState == WebSocket.OPEN) {
      chatWebsocketRef.current.send(message);
    }

    handleSendMessage(message);

    const userMessage: Message = {
      role: USER,
      content: message,
      audioUrl: '',
      message_id: `temp-${Date.now()}`,
      timestamp: new Date().toISOString()
    };

    setMessages(prevMessages => [...prevMessages, userMessage]);
  };



  return (
    <WebSocketContext.Provider value={{
      chatWebsocketRef,
      isChatConnected,
      isSendingMessage,
      isGeneratingImage,
      initChatWebSocket,
      sendStopMessage,
      handleSendMessage,
      toggleAudio,
      onSendTextMessage,
      toggleSpeakout,
      speakout,
      isLastMessagePauseRef
    }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;};
