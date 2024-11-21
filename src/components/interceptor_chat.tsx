'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ScrollArea } from "./ui/scroll-area"
import { Button } from "./ui/button"
import { useSearchParams } from 'next/navigation'
import axios from 'axios'
import { Wifi, WifiOff, User } from "lucide-react"

import { 
  Message, 
  GetChatHistoryResponse,
  API_BASE_URL,
} from './utils/chat/chat_utils'
import MessageComponents from './utils/admin/messages';

// import AdminVideo from './webrtc/admin';
import { AdminArtifactComponent } from './artifact/admin';
import AdminInputBar from './utils/admin/admin_input';
import { DarkModeToggle } from './themeContext';
import ImageLoader from '@/components/ui/loaders/image_loader';

const USER = 'user';
const ASSISTANT = 'assistant';
const CORRECTION = 'correction';
const INPUT = 'input';
const ADMIN = 'admin';
const GENERATING_IMAGE = 'generating_image';

export function InterceptorChat() {
  const searchParams = useSearchParams();
  const username = searchParams.get('username') || 'testuser';
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const chatWebsocketRef = useRef<WebSocket | null>(null);
  const [pausedMessage, setPausedMessage] = useState(false);
  const [isChatConnected, setIsChatConnected] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  // const [isVideoVisible, setIsVideoVisible] = useState(true); // State to manage visibility
  // const toggleVideoFeed = () => {
  //   setIsVideoVisible(prev => !prev); // Toggle visibility
  // };


  const initChatWebSocket = useCallback(() => {
    if (!chatWebsocketRef.current) {
      chatWebsocketRef.current = new WebSocket(
        `${process.env.NEXT_PUBLIC_WS_BASE_URL}/chat/${username}/0/interceptor`
      );

      chatWebsocketRef.current.onopen = () => {
        setIsChatConnected(true); // Set WebSocket connection status to true
        console.log("Chat WebSocket connection established");
      }

      chatWebsocketRef.current.onclose = () => {
        setIsChatConnected(false); // Set WebSocket connection status to false
        console.log("Chat WebSocket connection closed");
      }

      chatWebsocketRef.current.onerror = (error) => {
        console.error("WebSocket error observed:", error);
      }

      chatWebsocketRef.current.onmessage = async (event) => {
        const data = JSON.parse(event.data);
        const message = data.content;
        const role = data.role;

        if (role === GENERATING_IMAGE) {
          if (message === "start") {
            console.log("Image generation started");
            setIsGeneratingImage(true);
          } else if (message === "done") {
            console.log("Image generation done");
            setIsGeneratingImage(false);
          }
          return;
        }

        const finalMessage: Message = {
          role: data.role === USER ? USER : ASSISTANT,
          content: message,
          audioUrl: '',
          message_id: data.role === USER ? `temp-${Date.now()}` : `bot-${Date.now()}`,
          timestamp: new Date().toISOString(),
          isPlaying: false
        };
        setMessages(prevMessages => [...prevMessages, finalMessage]);
      };
    }
  }, [username]);

  // Initialize chat and load history
  useEffect(() => {
    const initializeChat = async () => {
      try {
        const historyResponse = await axios.get<GetChatHistoryResponse>(
        `${API_BASE_URL}/chat_history?user_id=${username}&session_id=0`,
        { headers: { 'Content-Type': 'application/json' } }
        );

        setMessages(historyResponse.data || []);

        // WebSocket setup
        initChatWebSocket();
        
      } catch (error) {
        console.error('Error initializing chat:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (typeof window !== 'undefined') {
      initializeChat();
    }

    return () => {
      chatWebsocketRef.current?.close()
      chatWebsocketRef.current = null;
    }

  }, [username, initChatWebSocket]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages]);

  const handleDeleteChat = async () => {
    try {
      await axios.delete(`${API_BASE_URL}/delete_chat?user_id=${username}&session_id=0`, {
        headers: {
          'Content-Type': 'application/json',
        }
      });
      setMessages([]); // Clear messages after deletion
      console.log("Chat deleted successfully.");
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
  };

  // Follow up message
  const handleSendMessage = useCallback(async (message: string, images: string[]) => {
    const userMessage: Message = {
      role: ADMIN,
      content: images.map(url => `![image](${url})\n\n`).join() + message,
      audioUrl: '',
      message_id: `temp-${Date.now()}`,
      timestamp: new Date().toISOString()
    };

    setMessages(prevMessages => [...prevMessages, userMessage]);
    
    if (chatWebsocketRef.current) {
      chatWebsocketRef.current.send(JSON.stringify({
        'role': INPUT,
        'content': message,
        'images': images
      }));
    }
  }, []);

  // Correction message
  const handleCorrectionMessage = useCallback(async (correction: string, images: string[]) => {
    setMessages(prevMessages => {
      let updatedMessages = prevMessages.slice(0, -1);
      // const lastMessage = updatedMessages[updatedMessages.length - 1];

      setPausedMessage(false);

      const userMessage: Message = {
        role: CORRECTION,
        content: images.map(url => `![image](${url})\n\n`).join() + correction,
        audioUrl: '',
        message_id: `temp-${Date.now()}`,
        timestamp: new Date().toISOString()
      };

      updatedMessages = [...updatedMessages, userMessage];
      
      return updatedMessages;
    });
    
    if (chatWebsocketRef.current) {
      chatWebsocketRef.current.send(JSON.stringify({
        'role': 'correction',
        'content': correction,
        'images': images,
      }));
    }
  }, [messages]);

  // Pause message
  const handlePauseMessage = useCallback(async () => {
    setPausedMessage(true);
    console.log("Message paused by the user.")
    if (chatWebsocketRef.current) {
      chatWebsocketRef.current.send(JSON.stringify({
        'role': 'pause',
        'content': '',
        'images': [],
      }))
    }
  }, [])


  if (isLoading) {
    return <div className="flex items-center justify-center h-screen bg-background text-foreground dark:bg-background dark:text-foreground">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary dark:border-primary"></div>
    </div>;
  }

  return (
    <div className="flex h-screen bg-background text-foreground dark:bg-background dark:text-foreground">
      {/* <UserSidebar username={username} /> */}
      
      <div className="flex flex-col flex-grow w-1/2">
        <header className="p-4 border-b border-border dark:border-border">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold text-primary-foreground dark:text-primary-foreground">MathTutor</h1>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-muted-foreground dark:text-muted-foreground" />
              <h3 className="text-lg text-muted-foreground dark:text-muted-foreground">{username}</h3>
              {(isChatConnected) ? (
                <Wifi className="text-green-500" size={20} />
              ) : (
                <WifiOff className="text-red-500" size={20} />
              )}
              <DarkModeToggle />
              <Button 
                className="bg-destructive text-destructive-foreground dark:bg-destructive dark:text-destructive-foreground" 
                onClick={handleDeleteChat}
              >
                Delete Chat
              </Button>
            </div>
          </div>
        </header>

        <ScrollArea className="flex-grow p-4" ref={scrollAreaRef}>
          <div className="space-y-6">
            <MessageComponents messages={messages} />
          </div>
        </ScrollArea>

        {isGeneratingImage ? (
          <div className="p-8">
            <ImageLoader />
          </div>
        ) : (
          <AdminInputBar 
            onSendMessage={handleSendMessage}
            onSendCorrection={handleCorrectionMessage}
            pausedMessage={pausedMessage}
            handlePauseMessage={handlePauseMessage}
          />
        )}

      </div>
      <div className="w-1/2 p-4 flex flex-col h-full">
        <AdminArtifactComponent username={username} />
        {/* <div className="fixed left-4 top-4 w-[15vw] h-[calc(15vw * 4 / 3)] max-w-[256px] max-h-[calc(256px * 4 / 3)]">
          <AdminVideo 
            username={username} 
            style={{ 
              visibility: isVideoVisible ? 'visible' : 'hidden', // Hide the video feed
              position: isVideoVisible ? 'static' : 'absolute', // Keep it in the flow or move it off-screen
            }} 
          />
          <button 
            onClick={toggleVideoFeed} 
            className="absolute left-0 top-0 bg-muted text-muted-foreground dark:bg-muted dark:text-muted-foreground p-2 rounded"
          >
            {isVideoVisible ? <PanelLeftCloseIcon className="h-4 w-4" /> : <PanelRightCloseIcon className="h-4 w-4" />}
          </button>
        </div> */}
      </div>
    </div>
  );
}
