'use client'

import { ClientOnly } from 'remix-utils/client-only';
import { BaseChat } from '@/components/bolt/components/chat/BaseChat';
import { Chat } from '@/components/bolt/components/chat/ChatClient';

export function Base() {
  return (
    <div className="flex flex-col h-full w-full">
      <ClientOnly fallback={<BaseChat />}>{() => <Chat />}</ClientOnly>
    </div>
  );
}
