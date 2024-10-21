'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';

interface UserArtifactProps {
  username: string;
  style?: React.CSSProperties;
  isRightColumnCollapsed: React.MutableRefObject<boolean>;
  toggleRightColumn: (override?: boolean) => void;
}


export const UserArtifactComponent: React.FC<UserArtifactProps> = ({ 
  username, 
  style, 
  isRightColumnCollapsed, 
  toggleRightColumn, 
}) => {
  const [htmlContent, setHtmlContent] = useState("");
  const [isHtmlLoading, setIsHtmlLoading] = useState(false);
  const htmlWebsocketRef = useRef<WebSocket | null>(null);

  const initHtmlWebSocket = useCallback((username: string) => {
    if (!htmlWebsocketRef.current) {
      htmlWebsocketRef.current = new WebSocket(`${process.env.NEXT_PUBLIC_WS_BASE_URL}/chat/user/html/${username}`);

      htmlWebsocketRef.current.onopen = () => {
        console.log('WebSocket connection established');
      };

      htmlWebsocketRef.current.onmessage = (event) => {
        if(isRightColumnCollapsed.current) {
          toggleRightColumn();
        }

        const data = JSON.parse(event.data);
        const message = data.content;

        if (message === "") {
          if(!isRightColumnCollapsed.current) {
            toggleRightColumn();
          }
        }

        const role = data.role;
        if (role === 'external') {
          setHtmlContent(message);
          setIsHtmlLoading(false);
        } else if (role === 'loading') {
          console.log("HTML Loading... ");
          setIsHtmlLoading(true);
        }
      };

      htmlWebsocketRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      htmlWebsocketRef.current.onclose = () => {
        console.log('WebSocket connection closed');
      };
    }
  }, []);
  

  useEffect(() => {
    const initializeChat = async () => {
      try {
        initHtmlWebSocket(username);

        return () => {
          htmlWebsocketRef.current?.close();
          htmlWebsocketRef.current = null;
        }
      } catch (error) {
        console.error('Error initializing artifact:', error);
      }
    }

    if (typeof window !== 'undefined') {
      initializeChat();
    }
  }, [username, initHtmlWebSocket]);

  return (
    <div className="flex-grow relative w-full h-full">
      {isHtmlLoading && (
        <motion.div 
          className="absolute inset-0 bg-muted/50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
        </motion.div>
      )}
      <iframe 
        srcDoc={htmlContent} 
        className="w-full h-full border-2 border-border rounded-lg" 
        title="Generated HTML"
      />
    </div>
  );
}