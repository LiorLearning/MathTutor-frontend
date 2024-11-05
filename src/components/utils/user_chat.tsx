'use client'

import React, { useState, useRef, useEffect, useCallback, useContext } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Input } from '@/components/ui/input';
import axios from 'axios'
import { motion } from 'framer-motion'
import { PanelRightClose, PanelLeftClose, ChevronLeft, ChevronRight, Send } from "lucide-react"

import { 
  Message,
  extractTextFromMessage,
  StartChatResponse, 
  GetChatHistoryResponse,
  API_BASE_URL,
} from './chat/chat_utils';
import MessageComponents from './chat/messages';
import Popup from './chat/popup';
import Header from './chat/header';
import SpeechToText from './chat/speech_to_text';

import { AudioContext } from './chat/audio_stream';
import UserVideo from '@/components/webrtc/user';
import { UserArtifactComponent } from '@/components/artifact/user';
import MessageLoader from '@/components/ui/loaders/message_loader';

const SPEAKOUT = true;
const SPEED = 30;

const CORRECTION = 'correction';
const INTERRUPT = 'interrupt';
const ASSISTANT = 'assistant';
const USER = 'user';
const PAUSE = 'pause';
const NOTEXT = 'notext';

const RETHINKING_MESSAGE = "Rethinking..."
const SLEEP_TIME_AFTER_MESSAGE = 2000

interface UserChatProps {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  username: string;
}

export function UserChat({ messages, setMessages, username }: UserChatProps) {
  const audioContext = useContext(AudioContext);
  if (!audioContext) {
    throw new Error('MessageCard must be used within an AudioProvider');
  }
  
  const [showPopup, setShowPopup] = useState(false);
  const handleEnterClass = () => {
    setShowPopup(false);
  };
  
  const [chatId, setChatId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [isChatConnected, setIsChatConnected] = useState(false);

  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const chatWebsocketRef = useRef<WebSocket | null>(null);
  const messageStreamIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const isLastMessagePauseRef = useRef<boolean>(false);

  const [isVideoVisible, setIsVideoVisible] = useState(true);

  const [isRightColumnCollapsed, setIsRightColumnCollapsed] = React.useState(true);
  const isRightColumnCollapsedRef = useRef<boolean>(isRightColumnCollapsed);

  const toggleRightColumn = () => {
    setIsRightColumnCollapsed(prev => {
      const newState = !prev;
      isRightColumnCollapsedRef.current = newState;
      return newState;
    });
  };
  
  const toggleVideoFeed = () => {
    setIsVideoVisible(prev => !prev);
  };

  const handleStopAudio = (message: Message) => {
    audioContext.stopAudio(message.message_id);
  };

  const handlePlayAudio = (messageId: string, messageText: string) => {
    if (!messageText.trim()) {
      return;
    }

    // Update messages state immediately
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
    // Handle audio for current message
    if (message.audioUrl) {
      console.log("Not implemented error")
    } else {
      const isPlaying = message.isPlaying;
      console.log(`${isPlaying ? 'Pausing' : 'Playing'} audio for message ID:`, message.message_id);

      // Update messages state immediately
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

  const initChatWebSocket = useCallback(async (username: string) => {
    if (!chatWebsocketRef.current) {
      chatWebsocketRef.current = new WebSocket(
        `${process.env.NEXT_PUBLIC_WS_BASE_URL}/chat/handle_chat/${username}`
      );
      chatWebsocketRef.current.onopen = () => {
        setIsChatConnected(true);
        console.log("Chat WebSocket connection established");
      }

      chatWebsocketRef.current.onerror = (error) => {
        console.error("Chat WebSocket error:", error);
        setIsChatConnected(false);
      };

      chatWebsocketRef.current.onclose = () => {
        console.log("Chat WebSocket connection closed");
        setIsChatConnected(false);
      };

      chatWebsocketRef.current.onmessage = async (event) => {
        console.log("WebSocket message received:", event.data); // Log the received event data

        const data = JSON.parse(event.data);
        const message = data.content;
        const role = data.role;
        console.log("Parsed message content:", message, "Role:", role); // Log parsed message and role

        switch (role) {
          case NOTEXT:
            console.log("No text received, setting isSendingMessage to false.");
            setIsSendingMessage(false);
            return;

          case PAUSE:
            console.log("Received PAUSE signal, setting rethinking state to true.");
            isLastMessagePauseRef.current = true;
            setMessages(prevMessages => {
                if (prevMessages[prevMessages.length - 1]?.role === ASSISTANT) {
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
            console.log("User message received:", message);
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
            console.log("Received INTERRUPT signal, pausing audio.");
            audioContext.stopAudio()
            return;

          case CORRECTION:
            setMessages(prevMessages => prevMessages.slice(0, -1));
            isLastMessagePauseRef.current = false;
            break;

          default:
            console.log("Unknown role received:", role);
            break;
        }

        const isImage = message.startsWith("![Generated");

        setIsSendingMessage(false);

        await new Promise(resolve => setTimeout(resolve, SLEEP_TIME_AFTER_MESSAGE));

        const finalMessage: Message = {
          role: ASSISTANT,
          content: '',
          audioUrl: '',
          message_id: `bot-${Date.now()}`,
          timestamp: new Date().toISOString(),
          isPlaying: SPEAKOUT,
          isImage: isImage
        };
        // const finalMessage = JSON.parse(JSON.stringify(tempMessage));

        if (SPEAKOUT) {
          const messageId = finalMessage.message_id
          let messageText = message
          if (message.isImage) {
            messageText = extractTextFromMessage(messageText);
          }
          handlePlayAudio(messageId, messageText);
        }

        if (isImage) {
          finalMessage.content = message; 
          if (isLastMessagePauseRef.current) {
            return;
          }
          setMessages(prevMessages => {
            const updatedMessages = prevMessages.filter(msg => msg.message_id !== finalMessage.message_id);
            return [...updatedMessages, finalMessage];
          });
        } else {
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
        }
      }
    }
  }, [audioContext, setMessages]);

  const handleRecordingStart = () => {
    audioContext.stopAudio();
  };

  const handleRecordingStop = (blob: Blob) => {
    handleSendMessage(blob);
  };

  const handleTextSend = async () => {
    if (textInput.trim() === "") return; // Prevent sending empty messages

    // Dummy message
    if (chatWebsocketRef.current?.readyState == WebSocket.OPEN) {
      chatWebsocketRef.current.send(textInput);
    }

    handleSendMessage(textInput);

    const userMessage: Message = {
      role: USER,
      content: textInput,
      audioUrl: '',
      message_id: `temp-${Date.now()}`,
      timestamp: new Date().toISOString()
    };

    setMessages(prevMessages => [...prevMessages, userMessage]);
    setTextInput(""); // Clear the input after sending
  };

  useEffect(() => {
    const initializeChat = async () => {
      try {
        if (chatId === "") {
          const response = await axios.post<StartChatResponse>(
            `${API_BASE_URL}/start_chat?user_id=${username}`,
            {},
            { headers: { 'Content-Type': 'application/json' } }
          );

          setChatId(response.data.chat_id);
          
          const historyResponse = await axios.get<GetChatHistoryResponse>(
            `${API_BASE_URL}/chat_history?user_id=${username}`,
            { headers: { 'Content-Type': 'application/json' } }
          );

          const filteredMessages = historyResponse.data.filter(
            message => message.role === USER || message.role === ASSISTANT
          );

          setMessages(filteredMessages);
        }

        initChatWebSocket(username);
        
        return () => {
          chatWebsocketRef.current?.close();
          chatWebsocketRef.current = null;
        };
        
      } catch (error) {
        console.error('Error initializing chat:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (typeof window !== 'undefined') {
      initializeChat();
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log("Visibility changed to visible - Reinitializing WebSocket");
        initChatWebSocket(username);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    }

  }, [username, chatId, initChatWebSocket]);

  useEffect(() => {
    const handleLoad = async () => {
      console.log("Handle load - WebSocket initialization");
      await initChatWebSocket(username);
    };

    window.addEventListener('load', handleLoad);
    
    // Call handleLoad only when the component mounts
    handleLoad();

    return () => {
      window.removeEventListener('load', handleLoad);
    }
  }, [username, initChatWebSocket])

  useEffect(() => {
    const scrollElement = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (!scrollElement) return;

    const handleScroll = () => {
      scrollElement.scrollTo({
        top: scrollElement.scrollHeight,
        behavior: 'auto'
      });
    };

    handleScroll();

    return () => {
      scrollElement.removeEventListener('scroll', handleScroll);
    };
  }, [messages, isSendingMessage]);

  const handleSendMessage = useCallback(async (message: Blob | string) => {
    if (chatWebsocketRef.current?.readyState == WebSocket.OPEN) {
      chatWebsocketRef.current.send(message);
    }

    audioContext.stopAudio();

    setIsSendingMessage(true);
  }, []);

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
    </div>;
  }
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {showPopup ? (
        <Popup handleEnterClass={handleEnterClass} />
      ) : (
        <React.Fragment>
          <motion.div
            className="flex-1 p-6 transition-all duration-200 ease-in-out"
            animate={{
              marginRight: isRightColumnCollapsed ? "15%" : "50%",
              marginLeft: isRightColumnCollapsed ? "15%" : "0%",
            }}
          >
            <div className="h-full flex flex-col border-r border-border">
              <Header 
                username={username} 
                isChatConnected={isChatConnected}
              />

              <ScrollArea ref={scrollAreaRef} className="flex-grow p-4 overflow-y-auto">
                <div className="space-y-6">
                  <MessageComponents 
                    messages={messages}
                    toggleAudio={toggleAudio}
                  />
                </div>
              </ScrollArea>
              
              {isSendingMessage ? (
                <div className="flex items-center justify-center h-12 w-full">
                  <MessageLoader />
                </div>
              ) : (
                <div className="pt-4 border-t border-border flex items-center justify-center">
                  <div className="relative flex flex-col items-center">
                    <div className="flex flex-col items-center gap-4 max-w-xs mx-auto">
                      <div className='relative w-1/2'>
                        <SpeechToText onRecordingStart={handleRecordingStart} onRecordingStop={handleRecordingStop} />
                      </div>
                      <div className="relative w-1/2">
                        <Input
                          type="text"
                          value={textInput}
                          onChange={(e) => setTextInput(e.target.value)}
                          placeholder="Type"
                          className="w-full h-12 text-black placeholder-gray-400 rounded-2xl px-4 py-3 pr-12 text-xs focus:outline-none focus:ring-2 focus:ring-gray-600 border border-gray-600"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleTextSend();
                            }
                          }}
                        />
                        <button
                          onClick={handleTextSend}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors"
                          aria-label="Send message"
                        >
                          <Send size={20} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          <motion.div
            className="fixed right-0 top-0 h-full w-[50%] bg-secondary p-6 shadow-lg transition-all duration-200 ease-in-out"
            animate={{
              x: isRightColumnCollapsed ? "100%" : "0%",
            }}
          >
            <UserArtifactComponent 
              username={username} 
              isRightColumnCollapsed={isRightColumnCollapsedRef}
              toggleRightColumn={toggleRightColumn} 
            />
          </motion.div>

          <div className="fixed right-4 top-4 w-[15vw] h-[calc(15vw * 4 / 3)] max-w-[256px] max-h-[calc(256px * 4 / 3)]">
            <UserVideo 
              username={username}
              style={{ 
                visibility: isVideoVisible ? 'visible' : 'hidden',
                position: isVideoVisible ? 'static' : 'absolute',
              }}
            />
            <button 
              onClick={toggleVideoFeed} 
              className="absolute top-0 right-0 bg-gray-800 text-white p-2 rounded"
            >
              {isVideoVisible ? <PanelRightClose className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </button>
          </div>

          <Button
            className="fixed bottom-4 right-4 z-10"
            onClick={toggleRightColumn}
            aria-label={isRightColumnCollapsed ? "Expand right column" : "Collapse right column"}
          >
            {isRightColumnCollapsed ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </React.Fragment>
      )}
    </div>
  )
}
