import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { webcontainer } from '@/components/bolt/lib/webcontainer';
import { ActionRunner } from '@/components/bolt/lib/runtime/action-runner';
import { FileAction, ShellAction } from '@/components/bolt/types/actions';
import { FileMap } from '@/components/bolt/lib/stores/files';
import { WORK_DIR } from '@/components/bolt/utils/constants';

// User WebSocket Provider
interface UserWebSocketContextType {
  sendJsonMessage: (data: any) => void;
  isConnected: boolean;
}

const UserWebSocketContext = createContext<UserWebSocketContextType | null>(null);

export const UserWebSocketProvider: React.FC<{ 
  base_url: string, 
  children: React.ReactNode, 
  isRightColumnCollapsed: React.MutableRefObject<boolean>, 
  toggleRightColumn: (override?: boolean) => void 
}> = ({ 
  children, 
  base_url, 
  isRightColumnCollapsed, 
  toggleRightColumn 
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const actionRunner = new ActionRunner(webcontainer);
  let actionCount = 0;


  const createAndRunAction = async (content: string) => {
    const action = {
      artifactId: 'artifact1',
      messageId: 'message1',
      actionId: String(actionCount++),
      action: {
        type: 'shell',
        content: content,
      } as ShellAction,
    };

    actionRunner.addAction(action);
    actionRunner.runAction(action);
  };

  const runCommands = async () => {
    try {
      console.log('Starting to run npm commands');

      await createAndRunAction('npm install');
      console.log('npm install completed');

      await createAndRunAction('npm run dev');
      console.log('npm run dev completed');
    } catch (error) {
      console.error('Failed to run npm commands:', error);
    }
  };

  const getFilteredPathName = (path: string): string => {
    if (path.startsWith(WORK_DIR)) {
      return path.slice(WORK_DIR.length);
    }
    return path;
  };

  const userSpecificMessageHandler = async (message: any) => {
    // User-specific WebSocket message handling logic
    if (message.role === 'files') {
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
            actionRunner.addAction(action);
            actionRunner.runAction(action);
          }
        }
      }
      await runCommands();
      if(isRightColumnCollapsed.current) {
        console.log('Right column is collapsed, toggling right column');
        toggleRightColumn(false);
      } else {
        console.log('Right column is not collapsed');
        if (message === "") {
          console.log('Message is empty, toggling right column');
          toggleRightColumn(true);
        }
      }

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

  const sendJsonMessage = (data: any) => {
    console.log('sendJsonMessage function is not implemented yet');
  };

  return (
    <UserWebSocketContext.Provider value={{ sendJsonMessage, isConnected }}>
      {children}
    </UserWebSocketContext.Provider>
  );
};

export const useUserWebSocket = () => useContext(UserWebSocketContext);
