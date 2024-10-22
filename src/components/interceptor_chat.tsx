'use client'

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useSearchParams } from 'next/navigation'
import axios from 'axios'
import { Send, User, PanelRightCloseIcon, PanelLeftCloseIcon } from "lucide-react"

import { 
  Message, 
  GetChatHistoryResponse,
  API_BASE_URL,
  MarkdownComponent,
} from '@/components/utils/chat_utils'
import { Student, MODEL_API_BASE_URL } from '@/components/utils/admin_utils'
import AdminVideo from '@/components/webrtc/admin';
import { AdminArtifactComponent } from '@/components/artifact/admin';

const USER = 'user';
const ASSISTANT = 'assistant';

function UserSidebar({ username }: { username: string }) {
  const [studentDetails, setStudentDetails] = useState<Student | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get<Student>(`${MODEL_API_BASE_URL}/users/${username}`);
        setStudentDetails(response.data);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, [username]);

  return (
    <div className="w-1/5 bg-gray-100 p-4 border-r">
      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">User Details</h2>
        {studentDetails ? (
          <div>
            <p><strong>User ID:</strong> {studentDetails.userid}</p>
            <p><strong>Name:</strong> {studentDetails.first_name} {studentDetails.last_name}</p>
            <p><strong>Grade:</strong> {studentDetails.grade}</p>
            <p><strong>Age:</strong> {studentDetails.age}</p>
            <p><strong>Parent/Guardian:</strong> {studentDetails.parent_guardian}</p>
            <p><strong>Email:</strong> {studentDetails.email}</p>
            <p><strong>Phone:</strong> {studentDetails.phone}</p>
            <p><strong>Country:</strong> {studentDetails.country}</p>
          </div>
        ) : (
          <p>Loading user details...</p>
        )}
      </div>
      <div>
        <h2 className="text-lg font-semibold mb-2">User Context</h2>
        <p className="text-sm">{studentDetails?.user_context || 'Loading user context...'}</p>
      </div>
    </div>
  );
}

export function InterceptorChat() {
  const searchParams = useSearchParams();
  const username = searchParams.get('username') || 'testuser';
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [correctionText, setCorrectionText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const lastBotMessageRef = useRef<HTMLDivElement>(null);
  const chatWebsocketRef = useRef<WebSocket | null>(null);
  const [pausedMessage, setPausedMessage] = useState(false);
  

  const [isVideoVisible, setIsVideoVisible] = useState(true); // State to manage visibility
  const toggleVideoFeed = () => {
    setIsVideoVisible(prev => !prev); // Toggle visibility
  };


  const initChatWebSocket = useCallback(() => {
    if (!chatWebsocketRef.current) {
      chatWebsocketRef.current = new WebSocket(
        `${process.env.NEXT_PUBLIC_WS_BASE_URL}/chat/interceptor/${username}`
      );
      chatWebsocketRef.current.onopen = () => {
        console.log("Chat WebSocket connection established");
      }

      chatWebsocketRef.current.onmessage = async (event) => {
        const data = JSON.parse(event.data);
        const message = data.content;
        if (data.role === 'correction') {
          setMessages(prevMessages => prevMessages.slice(0, -2));
        } else if (data.role !== USER && data.role !== ASSISTANT) {
          console.error("Error: Unrecognized role received in WebSocket message:", data.role);
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
        `${API_BASE_URL}/chat_history?user_id=${username}`,
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

    const handleUnload = () => {
      chatWebsocketRef.current?.close()
      chatWebsocketRef.current = null;
    };

    window.addEventListener('beforeunload', handleUnload);

    return () => {
      chatWebsocketRef.current?.close()
      chatWebsocketRef.current = null;

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
      await axios.delete(`${API_BASE_URL}/delete_chat?user_id=${username}`, {
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
  const handleSendMessage = useCallback(async () => {
    if (inputText.trim() === "") return;

    const userMessage: Message = {
      role: USER,
      content: inputText,
      audioUrl: '',
      message_id: `temp-${Date.now()}`,
      timestamp: new Date().toISOString()
    };

    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInputText("");

    if (chatWebsocketRef.current) {
      chatWebsocketRef.current.send(JSON.stringify({
        'role': 'input',
        'content': inputText
      }));
    }
  }, [inputText]);

  // Correction message
  const handleCorrectionMessage = useCallback(async () => {
    if (correctionText.trim() === "") return;

    setPausedMessage(false);

    const userMessage: Message = {
      role: USER,
      content: correctionText,
      audioUrl: '',
      message_id: `temp-${Date.now()}`,
      timestamp: new Date().toISOString()
    };

    setMessages(prevMessages => [...prevMessages, userMessage]);
    setCorrectionText("");

    if (chatWebsocketRef.current) {
      chatWebsocketRef.current.send(JSON.stringify({
        'role': 'correction',
        'content': correctionText,
      }));
    }
  }, [correctionText]);

  // Pause message
  const handlePauseMessage = useCallback(async () => {
    setPausedMessage(true);
    if (chatWebsocketRef.current) {
      chatWebsocketRef.current.send(JSON.stringify({
        'role': 'pause',
        'content': '',
      }))
    }
  }, [])

  const messageComponents = useMemo(() => (
    Array.isArray(messages) && messages.map((message, index) => (
      <div 
        key={message.message_id} 
        className="flex flex-col items-center justify-center h-full"
        ref={index === messages.length - 1 && message.role === ASSISTANT ? lastBotMessageRef : null}
      >
        <div className={`max-w-[90%] ${message.role === USER ? 'self-end' : 'self-start'}`}>
          <div
            className={`rounded-3xl p-4 ${
              message.role === USER
                ? 'bg-primary text-white'
                : 'bg-gray-200 text-gray-800'
            } ${message.role === ASSISTANT && index < messages.length - 1 ? 'opacity-50' : ''} 
            ${message.role === ASSISTANT && index === messages.length - 1 ? 'opacity-100' : ''}`}
          >
            <MarkdownComponent content={message.content} />
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
    <div className="flex h-screen bg-background">
      <UserSidebar username={username} />
      <div className="flex flex-col flex-grow w-1/2">
        <header className="p-4 border-b border-border">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold text-primary-foreground">MathTutor</h1>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-lg text-muted-foreground">{username}</h3>
              <Button 
                className="bg-destructive text-white" 
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

        
        <div className="p-6 border-t border-border flex items-center bg-muted space-x-2">
          {pausedMessage ? (
            <Input 
              className="flex-grow h-12 bg-white"
              placeholder="Update last assistant message..." 
              value={correctionText}
              onChange={(e) => setCorrectionText(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleCorrectionMessage();
                }
              }}
            />
          ) : (
            <Button 
              className="flex-grow h-12 bg-gray-500" 
              onClick={handlePauseMessage}
              disabled={messages.length > 0 && messages[messages.length - 1].role === USER}
            >
              Update last assistant message...
            </Button>
          )}
          
          <Button 
            size="icon" 
            className="h-12 w-12" 
            onClick={handleCorrectionMessage}
            disabled={correctionText.trim() === ''}
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="p-6 border-t border-border flex items-center bg-gray-500">
          <Input 
            className="flex-grow mr-2 h-12 bg-white"
            placeholder="Send follow up message..." 
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
      <div className="w-1/2 p-4 flex flex-col h-full">
        <AdminArtifactComponent username={username} />
        <div className="fixed right-4 bottom-4 lg:w-64 lg:h-48 w-32 h-24">
        <AdminVideo 
          username={username} 
          style={{ 
            visibility: isVideoVisible ? 'visible' : 'hidden', // Hide the video feed
            position: isVideoVisible ? 'static' : 'absolute', // Keep it in the flow or move it off-screen
          }} 
        />
        <button 
          onClick={toggleVideoFeed} 
          className="absolute top-0 right-0 bg-gray-800 text-white p-2 rounded"
        >
          {isVideoVisible ? <PanelRightCloseIcon className="h-4 w-4" /> : <PanelLeftCloseIcon className="h-4 w-4" />}
        </button>
      </div>
      </div>
    </div>
  );
}
