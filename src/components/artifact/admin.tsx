'use client'

import { ClientOnly } from 'remix-utils/client-only';
import { FallbackComponent } from '@/components/fallback';
import { Chat } from '@/components/bolt/components/chat/ChatClient';
import { WebSocketProvider } from '@/components/bolt/components/websocket';

export interface AdminArtifactProps {
    username: string;
    sessionId: string;
  }
  
  export const AdminArtifactComponent: React.FC<AdminArtifactProps> = ({ username, sessionId }) => {
  return (
    <div className="flex flex-col h-full w-full">
      <ClientOnly fallback={<FallbackComponent />}>
        {() => (
          <WebSocketProvider url={`${process.env.NEXT_PUBLIC_WS_BASE_URL}/bolt/ws/${username}/${sessionId}/admin`}>
            <Chat />
          </WebSocketProvider>
        )}
      </ClientOnly>
    </div>
  );
}
