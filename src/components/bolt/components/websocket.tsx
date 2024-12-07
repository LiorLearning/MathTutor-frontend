import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { workbenchStore, type WorkbenchViewType } from '@/components/bolt/lib/stores/workbench';
import { FileMap } from '../lib/stores/files';

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

  useEffect(() => {
    const ws = new WebSocket(url);
    socketRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connection established');
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      console.log('WebSocket message received:', event.data);
      try {
        const message = JSON.parse(event.data);
        const files = message.files;
        workbenchStore.setDocuments(files);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
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
