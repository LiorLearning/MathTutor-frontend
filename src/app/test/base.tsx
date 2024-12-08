'use client'

import { ClientOnly } from 'remix-utils/client-only';
import { BaseChat } from '@/components/bolt/components/chat/BaseChat';
import { Chat } from '@/components/bolt/components/chat/ChatClient';
import { WebSocketProvider } from '@/components/bolt/components/websocket';

export function Base() {
  return (
    <div className="flex flex-col h-full w-full">
      <ClientOnly fallback={<BaseChat />}>
        {() => (
          <WebSocketProvider url={`${process.env.NEXT_PUBLIC_WS_BASE_URL}/bolt/ws/testuser/1/admin`}>
            <Chat />
          </WebSocketProvider>
        )}
      </ClientOnly>
    </div>
  );
}
