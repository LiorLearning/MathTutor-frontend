'use client'

import React, { useState, useRef, useEffect, useCallback, useContext } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import axios from 'axios'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Square } from "lucide-react"

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

import { AudioContext } from './chat/eleven_labs_audio_stream';
// import UserVideo from '@/components/webrtc/user';
import { UserArtifactComponent } from '@/components/artifact/user';
import InputBar from './chat/input_bar';
import MessageLoader from '@/components/ui/loaders/message_loader';
import PageLoader from '../ui/loaders/page_loader';
import ImageLoader from '@/components/ui/loaders/image_loader';
import { getDeviceType } from './common_utils';


const deviceType = getDeviceType();
const SPEED = deviceType === "iOS" ? 0 : deviceType === "Mac" ? 30 : 15;

const CORRECTION = 'correction';
const INTERRUPT = 'interrupt';
const ASSISTANT = 'assistant';
const USER = 'user';
const PAUSE = 'pause';
const NOTEXT = 'notext';
const GENERATING_IMAGE = "generating_image"
const STOP = "101e0198-ab6e-41f7-bd30-0649c2132bc1"

const RETHINKING_MESSAGE = "rethinking"
const SLEEP_TIME_AFTER_MESSAGE = 1000

interface UserChatProps {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  username: string;
  sessionId: string;
}

export function UserChat({ messages, setMessages, username, sessionId }: UserChatProps) {
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
  const [isChatConnected, setIsChatConnected] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  const [speakout, setSpeakout] = useState(true);

  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const chatWebsocketRef = useRef<WebSocket | null>(null);
  const messageStreamIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const isLastMessagePauseRef = useRef<boolean>(false);
  const lastAssistantMessageRef = useRef<Message | null>(null);

  // const [isVideoVisible, setIsVideoVisible] = useState(true);

  const [isRightColumnCollapsed, setIsRightColumnCollapsed] = React.useState(true);
  const isRightColumnCollapsedRef = useRef<boolean>(isRightColumnCollapsed);

  const toggleRightColumn = () => {
    setIsRightColumnCollapsed(prev => {
      const newState = !prev;
      isRightColumnCollapsedRef.current = newState;
      return newState;
    });
  };
  
  // const toggleVideoFeed = () => {
  //   setIsVideoVisible(prev => !prev);
  // };

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
      console.error("Not implemented error")
    } else {
      const isPlaying = message.isPlaying;
      // console.log(`${isPlaying ? 'Pausing' : 'Playing'} audio for message ID:`, message.message_id);

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

  const initChatWebSocket = useCallback(async (username: string, speak: boolean = false) => {
    if (!chatWebsocketRef.current) {
      chatWebsocketRef.current = new WebSocket(
        `${process.env.NEXT_PUBLIC_WS_BASE_URL}/chat/${username}/${sessionId}/handle_chat`
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

          case PAUSE:
            // console.log("Received PAUSE signal, setting rethinking state to true.");
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
            // console.log("User message received:", message);
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
            // console.log("Received INTERRUPT signal, pausing audio.");
            audioContext.stopAudio()
            return;
            
          case GENERATING_IMAGE:
            if (message === "start") {
              // console.log("Image generation started");
              setIsGeneratingImage(true);
            } else if (message === "done") {
              // console.log("Image generation done");
              setIsGeneratingImage(false);
            }
            return;

          case CORRECTION:
            setMessages(prevMessages => prevMessages.slice(0, -1));
            isLastMessagePauseRef.current = false;
            break;

          default:
            console.error("Unknown role received:", role);
            break;
        }

        const isImage = message.includes('![Generated');

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
        // const finalMessage = JSON.parse(JSON.stringify(tempMessage));

        if (speak && !isLastMessagePauseRef.current) {
          handlePlayAudio(finalMessage.message_id, message);
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
  }

  // Function to send STOP message
  const sendStopMessage = () => {
    if (chatWebsocketRef.current?.readyState === WebSocket.OPEN) {
      chatWebsocketRef.current.send(STOP);
      chatWebsocketRef.current.send(STOP);
      handleStopMessage();
    }
  };

  // Speech to Text functions
  const handleRecordingStart = () => {
    audioContext.stopAudio();
  };

  const handleRecordingStop = (blob: Blob) => {
    handleSendMessage(blob);
  };

  const handleSendMessage = useCallback(async (message: Blob | string) => {
    if (chatWebsocketRef.current?.readyState == WebSocket.OPEN) {
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

  useEffect(() => {
    const initializeWebSocket = async () => {
      if (chatWebsocketRef.current) {
        chatWebsocketRef.current.close();
        chatWebsocketRef.current = null;
      }
      await initChatWebSocket(username, speakout);
    };

    initializeWebSocket();
  }, [speakout]);

  useEffect(() => {
    const initializeChat = async () => {
      try {
        if (chatId === "") {
          const response = await axios.post<StartChatResponse>(
            `${API_BASE_URL}/start_chat?user_id=${username}&session_id=${sessionId}`,
            {},
            { headers: { 'Content-Type': 'application/json' } }
          );

          setChatId(response.data.chat_id);
          
          const historyResponse = await axios.get<GetChatHistoryResponse>(
            `${API_BASE_URL}/chat_history?user_id=${username}&session_id=${sessionId}`,
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
  }, [username, chatId, initChatWebSocket]);

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

  if (isLoading) {
    return <PageLoader />;
  }
  return (
    <div className="flex h-screen overflow-hidden bg-background dark:bg-dark-background">
      {showPopup ? (
        <Popup handleEnterClass={handleEnterClass} />
      ) : (
        <React.Fragment>
          <motion.div
            className="flex-1 p-6 transition-all duration-200 ease-in-out"
            animate={{
              width: isRightColumnCollapsed ? "100%" : "50%",
            }}
            style={{
              marginRight: isRightColumnCollapsed ? "0%" : "50%",
            }}
          >
            <div className="h-full flex flex-col border-border dark:border-dark-border">
              <Header 
                username={username} 
                isChatConnected={isChatConnected}
                speakout={speakout}
                toggleSpeakout={toggleSpeakout}
              />

              <ScrollArea ref={scrollAreaRef} className="flex-grow p-4 overflow-y-auto">
                <div className="space-y-6">
                  <MessageComponents 
                    messages={messages}
                    toggleAudio={toggleAudio}
                  />
                </div>
              </ScrollArea>
              
              {isGeneratingImage || isSendingMessage || isLastMessagePauseRef.current ? (
                <div className="relative flex items-center justify-center">
                  <div className="flex items-center justify-center">
                    {isGeneratingImage ? <ImageLoader /> : <MessageLoader />}
                  </div>
                  {(isGeneratingImage || isSendingMessage) && (
                    <Button size="sm" onClick={sendStopMessage} className="ml-4">
                      <Square className="mr-2 text-sm" />
                      Stop
                    </Button>
                  )}
                </div>
              ) : (
                <div className="pt-4 border-t border-border dark:border-dark-border flex items-center justify-center">
                  <div className="relative flex flex-row items-center gap-4 max-w-xs mx-auto">
                    <div className='relative'>
                      <InputBar onSendMessage={onSendTextMessage} />
                    </div>
                    <div className='relative w-1/2'>
                      <SpeechToText onRecordingStart={handleRecordingStart} onRecordingStop={handleRecordingStop} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          <motion.div
            className="fixed right-0 top-0 h-full w-[50%] bg-secondary dark:bg-dark-secondary p-6 shadow-lg transition-all duration-200 ease-in-out"
            animate={{
              x: isRightColumnCollapsed ? "100%" : "0%",
            }}
          >
            <UserArtifactComponent 
              username={username} 
              isRightColumnCollapsed={isRightColumnCollapsedRef}
              toggleRightColumn={toggleRightColumn} 
              sessionId={sessionId}
            />
          </motion.div>

          {/* <div className="fixed right-8 top-20 w-[15vw] h-[calc(15vw * 4 / 3)] max-w-[256px] max-h-[calc(256px * 4 / 3)]">
            <UserVideo 
              username={username}
              style={{ 
                visibility: isVideoVisible ? 'visible' : 'hidden',
                position: isVideoVisible ? 'static' : 'absolute',
              }}
            />
            <Button 
              onClick={toggleVideoFeed} 
              className="absolute top-0 right-0 bg-gray-800 dark:bg-dark-gray-800 text-white p-2 rounded"
            >
              {isVideoVisible ? <PanelRightClose className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </Button>
          </div> */}

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
