'use client'

import React, { useState, useRef, useEffect } from 'react'
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Send, Mic } from "lucide-react"
import { useSearchParams } from 'next/navigation'
import axios from 'axios'

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  message_id: string;
}

interface StartChatResponse {
  chat_id: string;
}

type GetChatHistoryResponse = Message[];

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL + 'api/v1/chat';

export function Chat() {
  const searchParams = useSearchParams();
  const username = searchParams.get('username') || 'testuser';
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const lastBotMessageRef = useRef<HTMLDivElement>(null);
  const audioWebsocketRef = useRef<WebSocket | null>(null);
  const chatWebsocketRef = useRef<WebSocket | null>(null);

  // Initialize chat and load history
  useEffect(() => {
    const initializeChat = async () => {
      try {
        const startChatResponse = await axios.post<StartChatResponse>(
          `${API_BASE_URL}/start_chat?username=${username}`,
          {},
          { headers: { 'Content-Type': 'application/json' } }
        );
        
        const historyResponse = await axios.get<GetChatHistoryResponse>(
          `${API_BASE_URL}/chat_history/${username}`,
          { headers: { 'Content-Type': 'application/json' } }
        );

        setMessages(historyResponse.data || []);

        // WebSocket setup
        if (!chatWebsocketRef.current) {
          chatWebsocketRef.current = new WebSocket(
            `${process.env.NEXT_PUBLIC_WS_BASE_URL}/handle_chat/${username}`
          );
          chatWebsocketRef.current.onopen = () => {
            console.log("Chat WebSocket connection established");
          }

          chatWebsocketRef.current.onmessage = (event) => {
            const botMessage: Message = {
              role: 'assistant',
              content: event.data,
              message_id: `bot-${Date.now()}`,
              timestamp: new Date().toISOString()
            };
            setMessages(prevMessages => [...prevMessages, botMessage]);
          };
        }

        if (!audioWebsocketRef.current) {
          audioWebsocketRef.current = new WebSocket(
            `${process.env.NEXT_PUBLIC_WS_BASE_URL}/transcribe`
          );
          audioWebsocketRef.current.onopen = () => {
            console.log("Audio WebSocket connection established");
          }

          audioWebsocketRef.current.onmessage = (event) => {
            const transcribedText = event.data; // Get the transcribed text from the WebSocket
            console.log("Transcribed text: ", transcribedText);
            setInputText(transcribedText); // Update input text with transcribed text
          };
        }

        // Cleanup function
        return () => {
          if (audioWebsocketRef.current) {
            audioWebsocketRef.current.close();
          }
          if (chatWebsocketRef.current) {
            chatWebsocketRef.current.close();
          }
        };
        
      } catch (error) {
        console.error('Error initializing chat:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (typeof window !== 'undefined') {
      initializeChat();
    }

    // Cleanup function for chat session
    const cleanup = async () => {
      console.log("Username:", username);
      try {
        await axios.post(`${API_BASE_URL}/end_chat?user_id=${username}`, {}, {
          headers: {
            'Content-Type': 'application/json',
          }
        });
      } catch (error) {
        console.error('Error ending chat:', error);
      }
    };

    // Save chat function for chat session
    const saveChat = async () => {
      console.log("Username:", username);
      try {
        await axios.post(`${API_BASE_URL}/save_chat?user_id=${username}`, {}, {
          headers: {
            'Content-Type': 'application/json',
          }
        });
      } catch (error) {
        console.error('Error saving chat:', error);
      }
    };

    const handleUnload = () => {
      cleanup();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        saveChat();
      }
    };

    window.addEventListener('beforeunload', handleUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      cleanup();
      window.removeEventListener('beforeunload', handleUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);      
    }

  }, [username]);

  useEffect(() => {
    
  }, [username]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (inputText.trim() === "") return;

    const userMessage: Message = {
      role: 'user',
      content: inputText,
      message_id: `temp-${Date.now()}`,
      timestamp: new Date().toISOString()
    };
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setIsListening(false);
    setInputText("");

    if (chatWebsocketRef.current) {
      chatWebsocketRef.current.send(inputText);
    }
  };

  const handleAudioStop = async (blob: Blob) => {
    if (audioWebsocketRef.current) {
      const arrayBuffer = await blob.arrayBuffer();
      audioWebsocketRef.current.send(arrayBuffer);
    }
  };

  const toggleListening = () => {
    setIsListening(prevState => !prevState);
  };

  

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
    </div>;
  }

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto bg-white">
      <header className="p-4 border-b">
        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
          <div className="bg-blue-600 h-2.5 rounded-full w-1/2"></div>
        </div>
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold">MathTutor</h1>
          <div className="flex items-center gap-2">
            <h3 className="text-lg text-gray-500">{username}</h3>
          </div>
        </div>
      </header>
      
      <ScrollArea className="flex-grow p-4" ref={scrollAreaRef}>
        <div className="space-y-6">
          {Array.isArray(messages) && messages.map((message, index) => (
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
                  {message.content}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
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
  );
}