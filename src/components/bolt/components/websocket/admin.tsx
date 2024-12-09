import React, { createContext, useContext, useEffect, useRef, useState } from 'react';


// Admin WebSocket Provider
interface AdminWebSocketContextType {
    sendJsonMessage: (data: any) => void;
    isConnected: boolean;
  }
  
  const AdminWebSocketContext = createContext<AdminWebSocketContextType | null>(null);
  
  export const AdminWebSocketProvider: React.FC<{ base_url: string, children: React.ReactNode }> = ({ 
    children, 
    base_url 
  }) => {
    const [isConnected, setIsConnected] = useState(false);
    const socketRef = useRef<WebSocket | null>(null);
  
    const adminSpecificMessageHandler = (message: any) => {
      // Admin-specific WebSocket message handling logic
      if (message.role === 'admin') {
        // Different handling for admin messages
        console.log('Admin received message:', message);
        // Add specific admin message processing here
      }
    };
  
    useEffect(() => {
      const ws = new WebSocket(`${base_url}/admin`);
      socketRef.current = ws;
  
      ws.onopen = () => {
        console.log('Admin WebSocket connection established');
        setIsConnected(true);
      };
  
      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          adminSpecificMessageHandler(message);
        } catch (error) {
          console.error('Admin WebSocket message parse error:', error);
        }
      };
  
      ws.onerror = (error) => {
        console.error('Admin WebSocket error:', error);
      };
  
      ws.onclose = () => {
        setIsConnected(false);
      };
  
      return () => {
        ws.close();
      };
    }, [base_url]);
  
    const sendJsonMessage = (data: any) => {
      if (socketRef.current && isConnected) {
        socketRef.current.send(JSON.stringify(data));
      }
    };
  
    return (
      <AdminWebSocketContext.Provider value={{ sendJsonMessage, isConnected }}>
        {children}
      </AdminWebSocketContext.Provider>
    );
  };
  
  export const useAdminWebSocket = () => useContext(AdminWebSocketContext);