'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { useSearchParams } from 'next/navigation'
import axios from 'axios'
import { Square } from "lucide-react"

import { 
  Message, 
  GetChatHistoryResponse,
  API_BASE_URL,
} from '@/components/utils/user/chat_utils'
import MessageComponents from '@/components/utils/admin/messages';

// import AdminVideo from './webrtc/admin';
import { AdminArtifactComponent } from '@/components/artifact/admin';
import AdminInputBar from '@/components/utils/admin/admin_input';
import ImageLoader from '@/components/ui/loaders/image_loader';
import { SessionProvider } from '@/components/session-provider';
import { 
  CORRECTION, 
  CORRECTED, 
  ASSISTANT, 
  INPUT, 
  USER, 
  PAUSE, 
  GENERATING_IMAGE, 
  STOP, 
  END,
  ADMIN,
} from '@/components/utils/common_utils';
import AdminHeader from '@/components/utils/admin/admin-header';
import { ChatLoader } from '@/components/ui/loaders/chat_loader';

export function InterceptorChat() {
  const searchParams = useSearchParams();
  const username = searchParams?.get('username') || 'testuser';
  const sessionId = searchParams?.get('session') || '0';
  
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
        `${process.env.NEXT_PUBLIC_WS_BASE_URL}/chat/${username}/${sessionId}/interceptor`
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

        if (message === STOP) {
          setIsGeneratingImage(false);
          return;
        }

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
        `${API_BASE_URL}/chat_history?user_id=${username}&session_id=${sessionId}`,
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
      await axios.delete(`${API_BASE_URL}/delete_chat?user_id=${username}&session_id=${sessionId}`, {
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
      let updatedMessages = prevMessages;
      const lastMessageIndex = updatedMessages.length - 1;
      if (lastMessageIndex >= 0 && updatedMessages[lastMessageIndex].role === ASSISTANT) {
        updatedMessages[lastMessageIndex] = {
          ...updatedMessages[lastMessageIndex],
          role: CORRECTED
        };
      }

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
        'role': CORRECTION,
        'content': correction,
        'images': images,
      }));
    }
  }, [messages]);

  // Pause message
  const handlePauseMessage = useCallback(async () => {
    const latestMessageRole = messages[messages.length - 1]?.role;
    if (latestMessageRole !== ASSISTANT) {
      return;
    }
    setPausedMessage(true);
    console.log("Message paused by the user.")
    if (chatWebsocketRef.current) {
      chatWebsocketRef.current.send(JSON.stringify({
        'role': PAUSE,
        'content': '',
        'images': [],
      }))
    }
  }, [messages])

  const handleStopMessage = () => {
    setIsGeneratingImage(false);
  }


  const sendStopMessage = useCallback(async () => {
    if (chatWebsocketRef.current?.readyState === WebSocket.OPEN) {
      chatWebsocketRef.current.send(JSON.stringify({
        'role': STOP,
        'content': '',
        'images': [],
      }));
      handleStopMessage();
    }
  }, []);

  const handleEndSession = useCallback(() => {
    if (chatWebsocketRef.current?.readyState === WebSocket.OPEN) {
      chatWebsocketRef.current.send(JSON.stringify({
        'role': END,
        'content': '',
        'images': [],
      }));
    }
  }, []);

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen bg-background text-foreground dark:bg-background dark:text-foreground">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary dark:border-primary"></div>
    </div>;
  }

  return (
    <SessionProvider userId={username} sessionId={sessionId} route='/admin/interceptor'>
      {!isChatConnected ? (
        <ChatLoader />
      ) : (
        <div className="flex h-screen bg-background text-foreground dark:bg-background dark:text-foreground">
          {/* <UserSidebar username={username} /> */}
          
          <div className="flex flex-col flex-grow w-1/2">
            <AdminHeader 
              username={username} 
              sessionId={sessionId}
              isChatConnected={isChatConnected} 
              handleDeleteChat={handleDeleteChat} 
              onEndSession={handleEndSession}
            />

            <ScrollArea className="flex-grow p-4" ref={scrollAreaRef}>
              <div className="space-y-6">
                <MessageComponents messages={messages} />
              </div>
            </ScrollArea>

            {isGeneratingImage ? (
              <div className="relative flex items-center justify-center m-4">
                <div className="flex items-center justify-center m-2">
                  <ImageLoader />
                </div>
                <Button size="sm" onClick={sendStopMessage}>
                  <Square className="mr-2 text-sm" />
                  Stop
                </Button>
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
            <AdminArtifactComponent username={username} sessionId={sessionId} />
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
      )}
    </SessionProvider>
  );
}
