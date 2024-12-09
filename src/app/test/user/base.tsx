'use client'

import { ClientOnly } from 'remix-utils/client-only';
import { WebSocketProvider } from '@/components/bolt/components/websocket';
import { Workbench } from '@/components/bolt/components/workbench/Workbench.client';
import { FallbackComponent } from '@/components/fallback';
import { Preview } from '@/components/bolt/components/workbench/Preview';

export function Base() {
  return (
    <div className="flex flex-col h-full w-full">
      <ClientOnly fallback={<FallbackComponent />}>
        {() => (
          <WebSocketProvider base_url={`${process.env.NEXT_PUBLIC_WS_BASE_URL}/bolt/ws/test/0`} is_admin={false}>
            <div className="h-screen">
              {/* <Preview /> */}
              <Workbench isStreaming={false} chatStarted={true} />
            </div>
          </WebSocketProvider>
        )}
      </ClientOnly>
    </div>
  );
}
