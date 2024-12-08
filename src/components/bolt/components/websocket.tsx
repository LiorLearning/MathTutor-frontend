import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { workbenchStore } from '@/components/bolt/lib/stores/workbench';
import { webcontainer } from '@/components/bolt/lib/webcontainer';
import { ActionRunner, ActionState } from '../lib/runtime/action-runner';
import { FileAction, ShellAction } from '../types/actions';
import { FileMap } from '../lib/stores/files';
import { WORK_DIR } from '../utils/constants';

interface WebSocketContextType {
  sendJsonMessage: (data: any) => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export const useWebSocket = () => {
  return useContext(WebSocketContext);
};

export const WebSocketProvider: React.FC<{ children: React.ReactNode, url: string }> = ({ children, url }) => {
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

  useEffect(() => {
    const ws = new WebSocket(url);
    socketRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connection established');
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        const files: FileMap = message.files;

        for (const path in files) {
          if (files.hasOwnProperty(path)) {
            const dirent = files[path];
            if (dirent?.type === 'file') {
              const { content, isBinary } = dirent;
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

              actionRunner.addAction(action);
              actionRunner.runAction(action);
            }
          }
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
      runCommands();
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = (event) => {
      console.log('WebSocket connection closed:', event);
      setIsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, [url]);

  const sendJsonMessage = (data: any) => {
    if (socketRef.current && isConnected) {
      socketRef.current.send(JSON.stringify(data));
      console.log('WebSocket message sent:', data);
    } else {
      console.error('WebSocket is not connected');
    }
  };

  return (
    <WebSocketContext.Provider value={{ sendJsonMessage }}>
      {children}
    </WebSocketContext.Provider>
  );
};
