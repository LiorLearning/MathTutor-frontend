'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';

interface UserArtifactProps {
  username: string;
  isRightColumnCollapsed: React.MutableRefObject<boolean>;
  toggleRightColumn: (override?: boolean) => void;
  sessionId: string;
}


export const UserArtifactComponent: React.FC<UserArtifactProps> = ({ 
  username, 
  isRightColumnCollapsed, 
  toggleRightColumn, 
  sessionId,
}) => {
  const htmlContentRef = useRef<string>("");
  const [isHtmlLoading, setIsHtmlLoading] = useState(false);
  const htmlWebsocketRef = useRef<WebSocket | null>(null);

  const initHtmlWebSocket = useCallback((username: string) => {
    if (!htmlWebsocketRef.current) {
      htmlWebsocketRef.current = new WebSocket(`${process.env.NEXT_PUBLIC_WS_BASE_URL}/chat/${username}/${sessionId}/user/html`);

      htmlWebsocketRef.current.onopen = () => {
        console.log('WebSocket connection established');
      };

      htmlWebsocketRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        const message = data.content;
        const role = data.role;

        console.log('Received message with role:', role);
        if (role === 'external') {
          console.log('Role is external, updating htmlContentRef and setting isHtmlLoading to false');
          htmlContentRef.current = message; // Update to use htmlContentRef
          setIsHtmlLoading(false);
          
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

        } else if (role === 'loading') {
          setIsHtmlLoading(true);

        } else if (role == 'fetch') {
          if (htmlContentRef.current) {
            sendHtmlContent(); // This will send the current htmlContent
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

  const sendHtmlContent = useCallback(() => {
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