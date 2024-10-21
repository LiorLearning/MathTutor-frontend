'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

export const AdminArtifactComponent: React.FC<{ username: string; style?: React.CSSProperties }> = ({ username, style }) => {
  const [htmlContent, setHtmlContent] = useState("");
  const htmlWebsocketRef = useRef<WebSocket | null>(null);
  const [isCodeView, setIsCodeView] = useState(false);
  const [sendLoadingMessage, setSendLoadingMessage] = useState(true);

  const initHtmlWebSocket = useCallback((username: string) => {
    if (!htmlWebsocketRef.current) {
      htmlWebsocketRef.current = new WebSocket(`${process.env.NEXT_PUBLIC_WS_BASE_URL}/chat/interceptor/html/${username}`);

      htmlWebsocketRef.current.onopen = () => {
        console.log('WebSocket connection established');
      };

      htmlWebsocketRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        const message = data.content;
        setHtmlContent(prevHtml => prevHtml + message);
      };

      htmlWebsocketRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      htmlWebsocketRef.current.onclose = () => {
        console.log('WebSocket connection closed');
      };
    }
  }, []);

  const generateHtml = useCallback(() => {
    if (htmlWebsocketRef.current) {
      setHtmlContent("");
      const message = { action: "GENERATE", content: sendLoadingMessage ? "loading" : "" }; // Send loading message if toggle is on
      htmlWebsocketRef.current.send(JSON.stringify(message));
    }
  }, [sendLoadingMessage]); // Include sendLoadingMessage in dependencies

  const handleHtmlChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setHtmlContent(event.target.value);
  };

  const sendHtmlContent = () => {
    if (htmlWebsocketRef.current) {
      htmlWebsocketRef.current.send(JSON.stringify({ action: "SEND", content: htmlContent }));
    }
  };
  

  useEffect(() => {
    const initializeChat = async () => {
      try {
        initHtmlWebSocket(username);
        
        return () => {
          htmlWebsocketRef.current?.close()
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
    <>
        <div className="flex justify-between items-center mb-4">
            <Button onClick={generateHtml} className="mr-2">
            Generate HTML
            </Button>
            <Button onClick={sendHtmlContent} className="mr-2">
            Send
            </Button>
        </div>
        <div className="flex items-center mb-4">
            <Switch
            id="loading-message"
            checked={sendLoadingMessage}
            onCheckedChange={setSendLoadingMessage} // New toggle for loading message
            className="mr-2"
            />
            <Label htmlFor="loading-message" className="mr-4">
            Send Loading Message
            </Label>
            <Switch
            id="code-view"
            checked={isCodeView}
            onCheckedChange={setIsCodeView}
            className="mr-2"
            />
            <Label htmlFor="code-view">
            {isCodeView ? "Code View" : "Rendered View"}
            </Label>
        </div>
        {isCodeView ? (
            <Textarea
            value={htmlContent}
            onChange={handleHtmlChange}
            className="flex-grow font-mono text-sm"
            placeholder="HTML code will appear here"
            />
        ) : (
            <iframe 
            srcDoc={htmlContent} 
            className="flex-grow border-2 border-border rounded-md"
            title="Generated HTML"
            />
        )}
    </>    
  );
}
