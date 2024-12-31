"use client"

import { UserChat } from "../../components/utils/user_chat";
import React, { useState } from 'react';
import { useSearchParams } from 'next/navigation'
import { AudioProvider } from '../../components/utils/user/audio/eleven_labs_audio_stream';
import { SessionProvider } from '../../components/session-provider';
import { WebSocketProvider } from "@/components/utils/user/websocket";
import Popup from "@/components/utils/user/ui/popup";
import { QueryClient, QueryClientProvider } from 'react-query';
import { MessageProvider } from '@/components/utils/provider/message';

const queryClient = new QueryClient();


export default function Chat () {
  const searchParams = useSearchParams();
  const username = searchParams?.get('username') || 'testuser';
  const sessionId = searchParams?.get('session') || '0';
  const [showPopup, setShowPopup] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider userId={username} sessionId={sessionId} route='/chat'>
        <MessageProvider>
          <AudioProvider clientId={username}>
            <WebSocketProvider sessionId={sessionId} setShowPopup={setShowPopup}>
              {showPopup ? (
                <Popup setShowPopup={setShowPopup} username={username} sessionId={sessionId} />
              ) : (
                <UserChat username={username} sessionId={sessionId} />
              )}
            </WebSocketProvider>
          </AudioProvider>
        </MessageProvider>
      </SessionProvider>
    </QueryClientProvider>
  );
}
