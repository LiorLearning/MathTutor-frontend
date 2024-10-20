'use client'

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Send, User } from "lucide-react"
import { useSearchParams } from 'next/navigation'
import axios from 'axios'
import Image from 'next/image'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'

import { 
  Message, 
  GetChatHistoryResponse,
  API_BASE_URL,
} from '@/components/utils/chat_utils'
import { Student, MODEL_API_BASE_URL } from '@/components/utils/admin_utils'

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
  const htmlWebsocketRef = useRef<WebSocket | null>(null);

  const [htmlContent, setHtmlContent] = useState("");
  const [isCodeView, setIsCodeView] = useState(false);
  const [sendLoadingMessage, setSendLoadingMessage] = useState(true); // New state for loading message toggle

  const initHtmlWebSocket = useCallback(() => {
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
  }, [username]);

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
        initHtmlWebSocket();
        
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
      htmlWebsocketRef.current?.close()
      chatWebsocketRef.current = null;
      htmlWebsocketRef.current = null;
    };

    window.addEventListener('beforeunload', handleUnload);

    return () => {
      chatWebsocketRef.current?.close()
      htmlWebsocketRef.current?.close()
      chatWebsocketRef.current = null;
      htmlWebsocketRef.current = null;

      window.removeEventListener('beforeunload', handleUnload);
    }

  }, [username, initChatWebSocket, initHtmlWebSocket]);

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

  const handleSendMessage = useCallback(async () => {
    if (inputText.trim() === "") return;

    const userMessage: Message = {
      role: 'user',
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

  const handleCorrectionMessage = useCallback(async () => {
    if (correctionText.trim() === "") return;

    const userMessage: Message = {
      role: 'user',
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

  const messageComponents = useMemo(() => (
    Array.isArray(messages) && messages.map((message, index) => (
      <div 
        key={message.message_id} 
        className="flex flex-col items-center justify-center h-full"
        ref={index === messages.length - 1 && message.role === 'assistant' ? lastBotMessageRef : null}
      >
        <div className={`max-w-[90%] ${message.role === 'user' ? 'self-end' : 'self-start'}`}>
          <div
            className={`rounded-3xl p-4 ${
              message.role === 'user'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-800'
            } ${message.role === 'assistant' && index < messages.length - 1 ? 'opacity-50' : ''} 
            ${message.role === 'assistant' && index === messages.length - 1 ? 'opacity-100' : ''}`}
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkBreaks]}
              components={{
                h1: (props) => <h1 className="text-4xl font-bold my-4" {...props} />,
                h2: (props) => <h2 className="text-3xl font-bold my-3" {...props} />,
                h3: (props) => <h3 className="text-2xl font-bold my-2" {...props} />,
                p: (props) => <p className="" {...props} />,
                a: (props) => <a className="text-blue-500 underline" {...props} />,
                blockquote: (props) => <blockquote className="border-l-4 pl-4 italic text-gray-600" {...props} />,
                ul: (props) => <ul className="list-disc pl-5" {...props} />,
                ol: (props) => <ol className="list-decimal pl-5" {...props} />,
                br: () => <br key={Math.random()} />,
                img: ({ src, alt }) => (
                  <Image
                    src={src || ''}
                    alt={alt || ''}
                    width={500}
                    height={300}
                    className="rounded-lg"
                    style={{ objectFit: 'contain', width: '100%', height: 'auto' }}
                  />
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
      <div className="flex flex-col flex-grow w-2/5">
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

        <div className="p-6 border-t flex items-center bg-gray-200">
          <Input 
            className="flex-grow mr-2 h-12 bg-white"
            placeholder="Update last assistant message..." 
            value={correctionText}
            onChange={(e) => setCorrectionText(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleCorrectionMessage();
              }
            }}
          />
          <Button 
            size="icon" 
            className="h-12 w-12" 
            onClick={handleCorrectionMessage}
            disabled={correctionText.trim() === ''}
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="p-6 border-t flex items-center bg-blue-200">
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
      <div className="w-2/5 p-4 flex flex-col h-full">
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
            className="flex-grow border-2 border-gray-300 rounded-md"
            title="Generated HTML"
          />
        )}
      </div>
    </div>
  );
}
