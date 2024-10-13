'use client'

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Send, User } from "lucide-react"
import { useSearchParams } from 'next/navigation'
import axios from 'axios'
import ReactMarkdown from 'react-markdown'
import { 
  Message, 
  GetChatHistoryResponse,
  API_BASE_URL,
  MyImageComponent,
} from '@/components/utils/chat_utils'

function UserSidebar({ username }: { username: string }) {
  const [userContext, setUserContext] = useState<string>('');
  const [userDetails, setUserDetails] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const contextResponse = await axios.get<{context: string}>(`${API_BASE_URL}/user_context/${username}`);
        setUserContext(contextResponse.data.context);

        const detailsResponse = await axios.get<{name: string; email: string}>(`${API_BASE_URL}/user_details/${username}`);
        setUserDetails(detailsResponse.data);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, [username]);

  return (
    <div className="w-2/5 bg-gray-100 p-4 border-r">
      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">User Details</h2>
        {userDetails ? (
          <div>
            <p><strong>Name:</strong> {userDetails.name}</p>
            <p><strong>Email:</strong> {userDetails.email}</p>
          </div>
        ) : (
          <p>Loading user details...</p>
        )}
      </div>
      <div>
        <h2 className="text-lg font-semibold mb-2">User Context</h2>
        <p className="text-sm">{userContext || 'Loading user context...'}</p>
      </div>
    </div>
  );
}


export function InterceptorChat() {
  const searchParams = useSearchParams();
  const username = searchParams.get('username') || 'testuser';
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const lastBotMessageRef = useRef<HTMLDivElement>(null);
  const chatWebsocketRef = useRef<WebSocket | null>(null);

  const initChatWebSocket = useCallback((username: string) => {
    if (!chatWebsocketRef.current) {
      chatWebsocketRef.current = new WebSocket(
        `${process.env.NEXT_PUBLIC_WS_BASE_URL}/interceptor/${username}`
      );
      chatWebsocketRef.current.onopen = () => {
        console.log("Chat WebSocket connection established");
      }

      chatWebsocketRef.current.onmessage = async (event) => {
        const data = JSON.parse(event.data);
        const message = data.content;
        if (data.role === 'correction') {
          console.log("Inside Messages: ", messages)
          setMessages(prevMessages => prevMessages.slice(0, -2));
        } else if (data.role !== 'user' && data.role !== 'assistant') {
          console.error("Error: Unrecognized role received in WebSocket message:", data.role);
        }

        const finalMessage: Message = {
          role: data.role === 'user' ? 'user' : 'assistant',
          content: message,
          audioUrl: '',
          message_id: data.role === 'user' ? `temp-${Date.now()}` : `bot-${Date.now()}`,
          timestamp: new Date().toISOString(),
          isPlaying: false
        };
        setMessages(prevMessages => [...prevMessages, finalMessage]);
      };
    }
  }, [messages]);

  useEffect(() => {
    console.log("Messages: ", messages)
  }, [messages]);

  // Initialize chat and load history
  useEffect(() => {
    const initializeChat = async () => {
      try {
        const historyResponse = await axios.get<GetChatHistoryResponse>(
        `${API_BASE_URL}/chat_history/${username}`,
        { headers: { 'Content-Type': 'application/json' } }
        );

        setMessages(historyResponse.data || []);

        // WebSocket setup
        initChatWebSocket(username);
        
      } catch (error) {
        console.error('Error initializing chat:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (typeof window !== 'undefined') {
      initializeChat();
    }

    const handleUnload = () => {
      if (chatWebsocketRef.current) {
        chatWebsocketRef.current.close();
      }
    };

    window.addEventListener('beforeunload', handleUnload);

    return () => {
      if (chatWebsocketRef.current) {
        chatWebsocketRef.current.close();
      }
      window.removeEventListener('beforeunload', handleUnload);
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
      await axios.delete(`${API_BASE_URL}/delete_chat/${username}`, {
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

  const handleSendMessage = useCallback(async () => {
    if (inputText.trim() === "") return;

    const userMessage: Message = {
      role: 'user',
      content: inputText,
      message_id: `temp-${Date.now()}`,
      timestamp: new Date().toISOString()
    };

    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInputText("");

    if (chatWebsocketRef.current) {
      chatWebsocketRef.current.send(inputText);
    }
  }, [inputText]);

  const messageComponents = useMemo(() => (
    Array.isArray(messages) && messages.map((message, index) => (
      <div 
        key={message.message_id} 
        className="flex flex-col items-center"
        ref={index === messages.length - 1 && message.role === 'assistant' ? lastBotMessageRef : null}
      >
        <div className={`max-w-[80%] ${message.role === 'user' ? 'self-end' : 'self-start'}`}>
          <div
            className={`rounded-2xl p-4 ${
              message.role === 'user'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-800'
            } ${message.role === 'assistant' && index < messages.length - 1 ? 'opacity-50' : ''} 
            ${message.role === 'assistant' && index === messages.length - 1 ? 'opacity-100' : ''}`}
          >
            <ReactMarkdown
              components={{
                img: ({ src, alt }) => (
                  <MyImageComponent
                    src={src || ''}
                    alt={alt || ''}
                    width={500}
                    height={300}
                    className="rounded-lg"
                    style={{ objectFit: 'contain', width: '100%', height: 'auto' }}
                  />
                ),
                p: ({ children }) => (
                  <div>{children}</div>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {new Date(message.timestamp).toLocaleTimeString()}
          </div>
        </div>
      </div>
    ))
  ), [messages]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
    </div>;
  }

  return (
    <div className="flex h-screen bg-white">
      <UserSidebar username={username} />
      <div className="flex flex-col flex-grow">
        <header className="p-4 border-b">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold">MathTutor</h1>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5" />
              <h3 className="text-lg text-gray-500">{username}</h3>
              <Button 
                className="bg-red-500 text-white" 
                onClick={handleDeleteChat}
              >
                Delete Chat
              </Button>
            </div>
          </div>
        </header>

        <ScrollArea className="flex-grow p-4" ref={scrollAreaRef}>
          <div className="space-y-6">
            {messageComponents}
          </div>
        </ScrollArea>
        
        <div className="p-6 border-t flex items-center">
          <Input 
            className="flex-grow mr-2 h-12"
            placeholder="Type your message..." 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSendMessage();
              }
            }}
          />
          <Button 
            size="icon" 
            className="h-12 w-12" 
            onClick={handleSendMessage}
            disabled={inputText.trim() === ''}
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
