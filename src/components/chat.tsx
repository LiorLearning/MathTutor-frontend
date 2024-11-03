"use client"

import { UserChat } from "./utils/user_chat";
import React, { useState } from 'react';
import { AudioProvider} from '@/components/utils/audio_stream';
import { useSearchParams } from 'next/navigation'
import { Message } from "./utils/chat_utils";

export default function Chat () {
  const searchParams = useSearchParams();
  const username = searchParams.get('username') || 'testuser';

  const [messages, setMessages] = useState<Message[]>([]);

  const handlePlaybackEnd = (messageId: string) => {
    setMessages(prevMessages => 
      prevMessages.map(msg => 
        msg.message_id === messageId ? { ...msg, isPlaying: false } : msg
      )
    );
  };
  
  return (
    <AudioProvider clientId={username} onPlaybackEnd={handlePlaybackEnd}>
      <UserChat username={username} messages={messages} setMessages={setMessages}/>
    </AudioProvider>
  );
}
