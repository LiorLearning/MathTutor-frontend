"use client"

import { UserChat } from "./utils/user_chat";
import React from 'react';
import { AudioProvider} from '@/components/utils/audio_stream';
import { useSearchParams } from 'next/navigation'

export default function Chat () {
  const searchParams = useSearchParams();
  const username = searchParams.get('username') || 'testuser';
  
  return (
    <AudioProvider clientId={username}>
      <UserChat username={username}/>
    </AudioProvider>
  );
}
