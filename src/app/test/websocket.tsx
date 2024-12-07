import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

interface WebSocketContextType {
  sendJsonMessage: (data: any) => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export const useWebSocket = () => {
  return useContext(WebSocketContext);
};

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8000/ws');
    socketRef.current = ws;
    setSocket(ws);

    ws.onopen = () => {
      console.log('WebSocket connection established');
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      console.log('WebSocket message received:', event.data);
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
  }, []);

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
