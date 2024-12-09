'use client'

import { ClientOnly } from 'remix-utils/client-only';
import { WebSocketProvider } from '@/components/bolt/components/websocket';
// import { Workbench } from '@/components/bolt/components/workbench/Workbench.client';
import { FallbackComponent } from '@/components/fallback';
import { Preview } from '@/components/bolt/components/workbench/Preview';

interface UserArtifactProps {
    username: string;
    isRightColumnCollapsed: React.MutableRefObject<boolean>;
    toggleRightColumn: (override?: boolean) => void;
    sessionId: string;
  }
  
  
  export const UserArtifactComponent: React.FC<UserArtifactProps> = ({ 
    username, 
    isRightColumnCollapsed, 
    toggleRightColumn, 
    sessionId,
  }) => {
  return (
    <div className="flex flex-col h-full w-full">
      <ClientOnly fallback={<FallbackComponent />}>
        {() => (
          <WebSocketProvider url={`${process.env.NEXT_PUBLIC_WS_BASE_URL}/bolt/ws/${username}/${sessionId}/user`}>
            <div className="h-screen m-4">
              <Preview />
            </div>
          </WebSocketProvider>
        )}
      </ClientOnly>
    </div>
  );
}
