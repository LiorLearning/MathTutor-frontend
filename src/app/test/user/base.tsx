'use client'

import { ClientOnly } from 'remix-utils/client-only';
import { UserWebSocketProvider } from '@/components/bolt/components/websocket/user';
import { FallbackComponent } from '@/components/fallback';
import { Preview } from '@/components/bolt/components/workbench/Preview';

interface BaseProp {
    isRightColumnCollapsed?: React.MutableRefObject<boolean>;
    toggleRightColumn?: (override?: boolean) => void;
  }
  
  
  export const Base: React.FC<BaseProp> = ({ 
    isRightColumnCollapsed, 
    toggleRightColumn, 
  }) => {
  return (
    <div className="flex flex-col h-full w-full">
      <ClientOnly fallback={<FallbackComponent />}>
        {() => (
          <UserWebSocketProvider 
            base_url={`${process.env.NEXT_PUBLIC_WS_BASE_URL}/bolt/ws/test/0`}
            isRightColumnCollapsed={isRightColumnCollapsed ?? { current: false }}
            toggleRightColumn={toggleRightColumn ?? (() => {})}
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
