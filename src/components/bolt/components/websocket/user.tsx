import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
// import { webcontainer } from '@/components/bolt/lib/webcontainer';
import { workbenchStore } from '@/components/bolt/lib/stores/workbench';
import { FileAction } from '@/components/bolt/types/actions';
import { FileMap } from '@/components/bolt/lib/stores/files';
import { WORK_DIR } from '@/components/bolt/utils/constants';
import { useArtifactContext } from '@/components/utils/provider/artifact';

// User WebSocket Provider
interface UserWebSocketContextType {
  sendJsonMessage: () => void;
  isConnected: boolean;
}

const UserWebSocketContext = createContext<UserWebSocketContextType | null>(null);

export const UserWebSocketProvider: React.FC<{ 
  base_url: string, 
  children: React.ReactNode, 
  toggleRightColumn: (override?: boolean) => void,
  htmlContentRef: React.MutableRefObject<string>,
}> = ({ 
  children, 
  base_url, 
  toggleRightColumn,
  htmlContentRef,
}) => {
  const { setShowHtml } = useArtifactContext();
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  let actionCount = 0;

  const getFilteredPathName = (path: string): string => {
    if (path.startsWith(WORK_DIR)) {
      return path.slice(WORK_DIR.length);
    }
    return path;
  };

  const userSpecificMessageHandler = async (message: any) => {
    // User-specific WebSocket message handling logic
    if (message.role === 'files') {
      setShowHtml(false);
      const files: FileMap = message.content;
      for (const path in files) {
        if (files.hasOwnProperty(path)) {
          const dirent = files[path];

          if (dirent?.type === 'file') {
            const { content } = dirent;

            const action = {
              artifactId: 'artifact1',
              messageId: 'message1',
              actionId: String(actionCount++),
              action: {
                type: 'file',
                content: content,
                filePath: getFilteredPathName(path),
              } as FileAction,
            };

            console.log('Adding and running action:', action);
            workbenchStore.addAction(action);
            workbenchStore.runAction(action);
          }
        }
      }
      toggleRightColumn(false);
    }
    else if (message.role === 'image') {
        const html = message.content;
        setShowHtml(true);
        htmlContentRef.current = html
        toggleRightColumn(false);
    }
    else if (message.role === 'clear') {
      toggleRightColumn(true);
    }
  };


  useEffect(() => {
    const ws = new WebSocket(`${base_url}/user`);
    socketRef.current = ws;

    ws.onopen = () => {
      console.log('User WebSocket connection established');
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        userSpecificMessageHandler(message);
      } catch (error) {
        console.error('User WebSocket message parse error:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('User WebSocket error:', error);
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, [base_url]);

  const sendJsonMessage = () => {
    console.log('sendJsonMessage function is not implemented yet');
  };

  return (
    <UserWebSocketContext.Provider value={{ sendJsonMessage, isConnected }}>
      {children}
    </UserWebSocketContext.Provider>
  );
};

export const useUserWebSocket = () => useContext(UserWebSocketContext);
