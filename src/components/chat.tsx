"use client"

import { UserChat } from "./utils/user_chat";
import React, { useState } from 'react';
import { useSearchParams } from 'next/navigation'
import { AudioProvider } from './utils/chat/eleven_labs_audio_stream';
import { Message } from "./utils/chat/chat_utils";

export default function Chat () {
  const searchParams = useSearchParams();
  const username = searchParams.get('username') || 'testuser';

  const [messages, setMessages] = useState<Message[]>([]);

  const setIsPlaying = (messageId: string, isPlaying: boolean) => {
    setMessages(prevMessages => 
      prevMessages.map(msg => 
        msg.message_id === messageId ? { ...msg, isPlaying } : msg
      )
    );
  }
  
  return (
    <AudioProvider clientId={username} setIsPlaying={setIsPlaying}>
      <UserChat username={username} messages={messages} setMessages={setMessages}/>
    </AudioProvider>
  );
}
