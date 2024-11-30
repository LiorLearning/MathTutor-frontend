'use client'

import React, { useState, useRef, useEffect, useContext } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Square } from "lucide-react"
import axios from 'axios';

import { Message, API_BASE_URL, GetChatHistoryResponse, StartChatResponse } from './user/chat_utils';
import MessageComponents from './user/messages';
import Popup from './user/popup';
import Header from './user/header';
import SpeechToText from './user/audio/speech_to_text';

import { AudioContext } from './user/audio/eleven_labs_audio_stream';
import { UserArtifactComponent } from '@/components/artifact/user';
import InputBar from './user/input_bar';
import MessageLoader from '@/components/ui/loaders/message_loader';
import PageLoader from '../ui/loaders/page_loader';
import ImageLoader from '@/components/ui/loaders/image_loader';
import { ASSISTANT, USER } from './common_utils';


import { useWebSocket } from './user/websocket';


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

  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const {
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
  } = useWebSocket();


  const [isRightColumnCollapsed, setIsRightColumnCollapsed] = React.useState(true);
  const isRightColumnCollapsedRef = useRef<boolean>(isRightColumnCollapsed);

  const toggleRightColumn = () => {
    setIsRightColumnCollapsed(prev => {
      const newState = !prev;
      isRightColumnCollapsedRef.current = newState;
      return newState;
    });
  };

  // Speech to Text functions
  const handleRecordingStart = () => {
    audioContext.stopAudio();
  };

  const handleRecordingStop = (blob: Blob) => {
    if (chatWebsocketRef.current?.readyState === WebSocket.OPEN) {
      handleSendMessage(blob);
    } else {
      console.warn("Attempted to send message on closed WebSocket");
    }
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

        await initChatWebSocket(username);
        
        return () => {
          if (chatWebsocketRef.current) {
            chatWebsocketRef.current.close();
            chatWebsocketRef.current = null;
          }
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
  }, [username, initChatWebSocket]);

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
