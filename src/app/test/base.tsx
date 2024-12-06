'use client'

import { ClientOnly } from 'remix-utils/client-only';
import { BaseChat } from '@/components/bolt/components/chat/BaseChat';
import { Chat } from '@/components/bolt/components/chat/ChatClient';
// import { Workbench } from '@/components/bolt/components/workbench/Workbench.client';
import { Preview } from '@/components/bolt/components/workbench/Preview';

export function Base() {
  return (
    <div className="flex flex-col h-full w-full">
      {/* <div className="flex w-full">
        <div className="w-1/2">
          
        </div>
        <div className="w-1/2">
          <Workbench chatStarted={true} isStreaming={true} />
        </div>
      </div> */}
      {/* <Header /> */}
      {/* <BaseChat /> */}
      <ClientOnly fallback={<BaseChat />}>{() => <Chat />}</ClientOnly>
      {/* <Preview /> */}
    </div>
  );
}
