import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { webcontainer } from '@/components/bolt/lib/webcontainer';
import { ActionRunner } from '@/components/bolt/lib/runtime/action-runner';
import { FileAction, ShellAction } from '@/components/bolt/types/actions';
import { FileMap } from '@/components/bolt/lib/stores/files';
import { WORK_DIR } from '@/components/bolt/utils/constants';

// User WebSocket Provider
interface UserWebSocketContextType {
  sendJsonMessage: () => void;
  isConnected: boolean;
}

const UserWebSocketContext = createContext<UserWebSocketContextType | null>(null);

export const UserWebSocketProvider: React.FC<{ 
  base_url: string, 
  children: React.ReactNode, 
  isRightColumnCollapsed: React.MutableRefObject<boolean>, 
  toggleRightColumn: (override?: boolean) => void,
  htmlContentRef: React.MutableRefObject<string>,
  setShowHtml: React.Dispatch<React.SetStateAction<boolean>>
}> = ({ 
  children, 
  base_url, 
  isRightColumnCollapsed, 
  toggleRightColumn,
  htmlContentRef,
  setShowHtml
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const actionRunner = useRef<ActionRunner>();
  let actionCount = 0;

  useEffect(() => {
    if (webcontainer) {
      actionRunner.current = new ActionRunner(webcontainer);
    }
  }, []);


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

    actionRunner.current?.addAction(action);
    actionRunner.current?.runAction(action);
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

  const toggleRightCol = () => {
    const isCollapsed = isRightColumnCollapsed.current;
    console.log(`Right column is ${isCollapsed ? 'collapsed' : 'not collapsed'}, toggling right column`);
    toggleRightColumn(!isCollapsed);
  }

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
            actionRunner.current?.addAction(action);
            actionRunner.current?.runAction(action);
          }
        }
      }
      await runCommands();
      toggleRightCol();
    }
    else if (message.role === 'image') {
        const html = message.content;
        setShowHtml(true);
        htmlContentRef.current = html
        toggleRightCol();
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