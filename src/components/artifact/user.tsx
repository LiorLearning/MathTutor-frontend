'use client'

import { ClientOnly } from 'remix-utils/client-only';
import { UserWebSocketProvider } from '@/components/bolt/components/websocket/user';
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
          <UserWebSocketProvider 
            base_url={`${process.env.NEXT_PUBLIC_WS_BASE_URL}/bolt/ws/${username}/${sessionId}`}
            isRightColumnCollapsed={isRightColumnCollapsed}
            toggleRightColumn={toggleRightColumn}
          >
            <div className="h-screen m-4">
              <Preview />
            </div>
          </UserWebSocketProvider>
        )}
      </ClientOnly>
    </div>
  );
}
