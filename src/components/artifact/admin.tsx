'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X } from 'lucide-react'

export const AdminArtifactComponent: React.FC<{ username: string }> = ({ username }) => {
  const [htmlContent, setHtmlContent] = useState("");
  const [userHtmlContent, setUserHtmlContent] = useState("");
  
  const [adminPrompt, setAdminPrompt] = useState("");
  const htmlWebsocketRef = useRef<WebSocket | null>(null);
  
  const [seeUserHtml, setSeeUserHtml] = useState(true);
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
      const message = { 
        action: "GENERATE", 
        content: sendLoadingMessage ? "loading" : "",
        prompt: adminPrompt,
      };
      htmlWebsocketRef.current.send(JSON.stringify(message));
      setAdminPrompt("");
    }
  }, [sendLoadingMessage, adminPrompt]); // Include sendLoadingMessage in dependencies

  const handleHtmlChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setHtmlContent(event.target.value);
  };

  const sendHtmlContent = () => {
    if (htmlWebsocketRef.current) {
      htmlWebsocketRef.current.send(JSON.stringify({ 
        action: "SEND", 
        content: htmlContent,
        prompt: ""
      }));
      setUserHtmlContent(htmlContent);
    }
  };

  const clearHtmlContent = () => {
    setHtmlContent(""); // Clear the HTML content
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
          <h2 className="mr-2">{seeUserHtml ? "Admin Artifact" : "User Artifact"}</h2>
          <Button onClick={sendHtmlContent} className="mr-2">Send</Button>
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
        <div className="relative flex-grow border-2 border-border rounded-md">
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 flex items-center">
            <Switch
              id="user-artifact"
              checked={seeUserHtml}
              onCheckedChange={setSeeUserHtml}
              className="mr-2"
            />
          </div>
          {seeUserHtml ? (
            <>
              <button 
                onClick={clearHtmlContent} 
                className="absolute top-2 right-2 bg-gray-500 text-white rounded px-2 py-1"
              >
                <X size={18}/>
              </button>
              <iframe 
                srcDoc={htmlContent} 
                className="w-full h-full"
                title="Generated HTML"
              />
            </>
          ) : (
            <iframe 
              srcDoc={userHtmlContent} 
              className="w-full h-full"
              title="Generated HTML"
            />
          )}
        </div>
      )}
      <div className="flex items-center mt-4">
        <div className="flex items-center w-full">
          <Input 
            value={adminPrompt} 
            className="flex-grow mr-2 h-12" 
            onChange={(e) => setAdminPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                generateHtml();
              }
            }}
            placeholder="Enter prompt here..." 
          />
          <Button
            onClick={generateHtml}
            className="h-12" 
          >
            Generate Artifact
          </Button>
        </div>
      </div>
    </>    
  );
}


