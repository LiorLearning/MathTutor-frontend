"use client"

import { UserChat } from "../../components/utils/user_chat";
import React, { useState } from 'react';
import { useSearchParams } from 'next/navigation'
import { AudioProvider } from '../../components/utils/user/audio/eleven_labs_audio_stream';
import { Message } from "../../components/utils/user/chat_utils";
import { SessionProvider } from '../../components/session-provider';
import { WebSocketProvider } from "@/components/utils/user/websocket";

export default function Chat () {
  const searchParams = useSearchParams();
  const username = searchParams.get('username') || 'testuser';
  const sessionId = searchParams.get('session') || '0';

  const [messages, setMessages] = useState<Message[]>([]);

  const setIsPlaying = (messageId: string, isPlaying: boolean) => {
    setMessages(prevMessages => 
      prevMessages.map(msg => 
        msg.message_id === messageId ? { ...msg, isPlaying } : msg
      )
    );
  }

  return (
    <SessionProvider userId={username} sessionId={sessionId} route='/chat'>
      <AudioProvider clientId={username} setIsPlaying={setIsPlaying}>
        <WebSocketProvider sessionId={sessionId} setMessages={setMessages}>
          <UserChat username={username} messages={messages} setMessages={setMessages} sessionId={sessionId} />
        </WebSocketProvider>
      </AudioProvider>
    </SessionProvider>
  );
}
