"use client"

import { Chat } from "@/components/chat";
import React, { Suspense } from 'react';
import { AudioProvider} from '@/components/utils/audio_stream';
import { useSearchParams } from 'next/navigation'

export default function ChatPage() {
  const searchParams = useSearchParams();
  const username = searchParams.get('username') || 'testuser';
  
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AudioProvider clientId={username}>
        <Chat username={username}/>
      </AudioProvider>
    </Suspense>
  );
}
