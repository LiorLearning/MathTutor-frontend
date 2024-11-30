'use client'

import React, { useState, useRef, useEffect, useContext } from 'react';
import axios from 'axios';

import { Message, API_BASE_URL, GetChatHistoryResponse, StartChatResponse } from './user/chat_utils';
import Popup from './user/popup';

import { AudioContext } from './user/audio/eleven_labs_audio_stream';
import PageLoader from '../ui/loaders/page_loader';
import { ASSISTANT, USER } from './common_utils';
import DesktopChat from './user/ui/desktop';
import MobileChat from './user/ui/mobile';

import { useWebSocket } from './user/websocket';
import { getDeviceType, ANDROID_PHONE, IPHONE } from './common_utils';

const deviceType = getDeviceType();

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

  const isRightColumnCollapsedRef = useRef<boolean>(true);

  const toggleRightColumn = () => {
    isRightColumnCollapsedRef.current = !isRightColumnCollapsedRef.current;
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
        (deviceType === IPHONE || deviceType === ANDROID_PHONE) ? (
          <MobileChat
            username={username}
            isChatConnected={isChatConnected}
            speakout={speakout}
            toggleSpeakout={toggleSpeakout}
            messages={messages}
            toggleAudio={toggleAudio}
            isGeneratingImage={isGeneratingImage}
            isSendingMessage={isSendingMessage}
            isLastMessagePauseRef={isLastMessagePauseRef}
            sendStopMessage={sendStopMessage}
            onSendTextMessage={onSendTextMessage}
            handleRecordingStart={handleRecordingStart}
            handleRecordingStop={handleRecordingStop}
            sessionId={sessionId}
          />
        ) : (
          <DesktopChat
            username={username}
            isChatConnected={isChatConnected}
            speakout={speakout}
            toggleSpeakout={toggleSpeakout}
            scrollAreaRef={scrollAreaRef}
            messages={messages}
            toggleAudio={toggleAudio}
            isGeneratingImage={isGeneratingImage}
            isSendingMessage={isSendingMessage}
            isLastMessagePauseRef={isLastMessagePauseRef}
            sendStopMessage={sendStopMessage}
            onSendTextMessage={onSendTextMessage}
            handleRecordingStart={handleRecordingStart}
            handleRecordingStop={handleRecordingStop}
            isRightColumnCollapsedRef={isRightColumnCollapsedRef}
            toggleRightColumn={toggleRightColumn}
            sessionId={sessionId}
          />
        )
      )}
    </div>
  )
}
