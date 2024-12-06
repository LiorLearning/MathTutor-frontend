'use client'

import { ClientOnly } from 'remix-utils/client-only';
import { BaseChat } from '@/components/bolt/components/chat/BaseChat';
import { Chat } from '@/components/bolt/components/chat/ChatClient';
import { Header } from '@/components/bolt/components/header/Header';
import { Workbench } from '@/components/bolt/components/workbench/Workbench.client';

import { useStore } from '@nanostores/react';
import { themeStore } from '@/components/bolt/lib/stores/theme';



export function Base() {
  const theme = useStore(themeStore);
  
  return (
    <div className="flex flex-col h-full w-full">
      <Workbench chatStarted={true} isStreaming={true} />
      {/* <Header /> */}
      {/* <BaseChat /> */}
      {/* <ClientOnly fallback={<BaseChat />}>{() => <Chat />}</ClientOnly> */}
    </div>
  );
}
