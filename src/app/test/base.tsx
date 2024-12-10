'use client'

import { BaseChat } from '@/components/bolt/components/chat/BaseChat';
import { FallbackComponent } from '@/components/fallback';
import { Chat } from '@/components/bolt/components/chat/ChatClient';
import { AdminWebSocketProvider } from '@/components/bolt/components/websocket/admin';

export function Base() {
  return (
    <div className="flex flex-col h-full w-full">
      <AdminWebSocketProvider base_url={`${process.env.NEXT_PUBLIC_WS_BASE_URL}/bolt/ws/test/0`}>
        <Chat />
      </AdminWebSocketProvider>
    </div>
  );
}
