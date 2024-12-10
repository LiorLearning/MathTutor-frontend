'use client'

import { useState, useRef } from 'react';
import { UserWebSocketProvider } from '@/components/bolt/components/websocket/user';
// import { Workbench } from '@/components/bolt/components/workbench/Workbench.client';
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
  const htmlContentRef = useRef<string>('');
  const [showHtml, setShowHtml] = useState(true);

  return (
    <div className="flex flex-col h-full w-full">
      <UserWebSocketProvider 
        base_url={`${process.env.NEXT_PUBLIC_WS_BASE_URL}/bolt/ws/${username}/${sessionId}`}
        isRightColumnCollapsed={isRightColumnCollapsed}
        toggleRightColumn={toggleRightColumn}
        htmlContentRef={htmlContentRef}
        setShowHtml={setShowHtml}
      >
        <div className="h-screen m-4">
          {showHtml ? 
            <>
              <iframe 
                srcDoc={htmlContentRef.current}
                className="w-full h-full border-2 border-border dark:border-border rounded-lg" 
                title="Generated HTML"/> 
            </>
              : <Preview />
          }
        </div>
      </UserWebSocketProvider>
    </div>
  );
}
