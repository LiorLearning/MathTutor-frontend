'use client'

import { useRef } from 'react';
import { UserWebSocketProvider } from '@/components/bolt/components/websocket/user';
import { useArtifactContext } from '@/components/utils/provider/artifact';
import dynamic from 'next/dynamic';

const Preview = dynamic(() => import('@/components/bolt/components/workbench/Preview'), {
  ssr: false,
});

interface UserArtifactProps {
  username: string;
  sessionId: string;
}

export const UserArtifactComponent: React.FC<UserArtifactProps> = ({ 
  username, 
  sessionId,
}) => {
  const { showHtml, toggleRightColumn } = useArtifactContext();
  const htmlContentRef = useRef<string>('');

  return (
    <div className="flex flex-col h-full w-full">
      <UserWebSocketProvider 
        base_url={`${process.env.NEXT_PUBLIC_WS_BASE_URL}/bolt/ws/${username}/${sessionId}`}
        toggleRightColumn={toggleRightColumn}
        htmlContentRef={htmlContentRef}
      >
        <div className="h-screen">
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
