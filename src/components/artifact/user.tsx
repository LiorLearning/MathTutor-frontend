'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';

interface UserArtifactProps {
  username: string;
  isRightColumnCollapsed: React.MutableRefObject<boolean>;
  toggleRightColumn: (override?: boolean) => void;
}


export const UserArtifactComponent: React.FC<UserArtifactProps> = ({ 
  username, 
  isRightColumnCollapsed, 
  toggleRightColumn, 
}) => {
  const htmlContentRef = useRef<string>("");
  const [isHtmlLoading, setIsHtmlLoading] = useState(false);
  const htmlWebsocketRef = useRef<WebSocket | null>(null);

  const initHtmlWebSocket = useCallback((username: string) => {
    if (!htmlWebsocketRef.current) {
      htmlWebsocketRef.current = new WebSocket(`${process.env.NEXT_PUBLIC_WS_BASE_URL}/chat/user/html/${username}/0`);

      htmlWebsocketRef.current.onopen = () => {
        console.log('WebSocket connection established');
      };

      htmlWebsocketRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        const message = data.content;
        const role = data.role;

        if (role === 'external') {
          htmlContentRef.current = message; // Update to use htmlContentRef
          setIsHtmlLoading(false);
          
          if(isRightColumnCollapsed.current) {
            toggleRightColumn();
          } else {
            if (message === "") {
              toggleRightColumn();
            }
          }

        } else if (role === 'loading') {
          setIsHtmlLoading(true);

        } else if (role == 'fetch') {
          if (htmlContentRef.current) {
            sentHtmlContent(); // This will send the current htmlContent
          }
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

  const sentHtmlContent = useCallback(() => {
    if (htmlWebsocketRef.current) {
      htmlWebsocketRef.current.send(JSON.stringify({ 
        role: "fetch", 
        content: htmlContentRef.current, // Update to use htmlContentRef
      }));
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
          className="absolute inset-0 bg-muted/50 dark:bg-muted/30 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary dark:border-primary-foreground"></div>
        </motion.div>
      )}
      <iframe 
        srcDoc={htmlContentRef.current} // Update to use htmlContentRef
        className="w-full h-full border-2 border-border dark:border-border rounded-lg" 
        title="Generated HTML"
      />
    </div>
  );
}