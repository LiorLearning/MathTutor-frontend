'use client'

import React, { useState, useRef, useEffect } from 'react'
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Send, Mic, Pause, Volume2 } from "lucide-react"
import { useSearchParams } from 'next/navigation'
import axios from 'axios'
import ReactMarkdown from 'react-markdown'

interface Message {
  role: 'user' | 'assistant';
  content: string;
  audioUrl?: string; // Added audioUrl to store audio
  timestamp: string;
  message_id: string;
  isPlaying?: boolean; // Added isPlaying to track audio state per message
}

interface StartChatResponse {
  chat_id: string;
}

type GetChatHistoryResponse = Message[];

interface ImageProps {
  src: string;
  alt?: string;
  width?: number;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
}

const imageProps: ImageProps = {
  src: 'https://example.com/image.jpg', // Replace with your image URL
  alt: 'Description of the image',
  width: 500,
  height: 300,
  className: 'rounded-lg',
  style: { objectFit: 'contain', width: '100%', height: 'auto' },
};

const MyImageComponent: React.FC<ImageProps> = ({ src, alt, width, height, className, style }) => {
  return (
      <img
          src={src}
          alt={alt || ''}
          width={width || 500}
          height={height || 300}
          className={`rounded-lg ${className}`}
          style={style}
      />
  );
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL + 'api/v1/chat';
const SPEECH_API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL + 'api/v1/speech';
const WS_END_SIGNAL = "WS_END_SIGNAL";

export function Chat() {
  const searchParams = useSearchParams();
  const username = searchParams.get('username') || 'testuser';
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatId, setChatId] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [partialMessage, setPartialMessage] = useState<string>('');
  const [isReceivingMessage, setIsReceivingMessage] = useState(false);
  const partialMessageRef = useRef<string>('');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const lastBotMessageRef = useRef<HTMLDivElement>(null);
  const audioWebsocketRef = useRef<WebSocket | null>(null);
  const chatWebsocketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    console.log("Current partialMessage:", partialMessage);
  }, [partialMessage]);

  // Initialize chat and load history
  useEffect(() => {
    const initializeChat = async () => {
      try {
        if (chatId === "") {
          const response = await axios.post<StartChatResponse>(
            `${API_BASE_URL}/start_chat?username=${username}`,
            {},
            { headers: { 'Content-Type': 'application/json' } }
          );

          setChatId(response.data.chat_id);
          
          const historyResponse = await axios.get<GetChatHistoryResponse>(
            `${API_BASE_URL}/chat_history/${username}`,
            { headers: { 'Content-Type': 'application/json' } }
          );

          setMessages(historyResponse.data || []);
        }

        // WebSocket setup
        if (!chatWebsocketRef.current) {
          chatWebsocketRef.current = new WebSocket(
            `${process.env.NEXT_PUBLIC_WS_BASE_URL}/handle_chat/${username}`
          );
          chatWebsocketRef.current.onopen = () => {
            console.log("Chat WebSocket connection established");
          }

          chatWebsocketRef.current.onmessage = async (event) => {
            if (event.data === WS_END_SIGNAL) {
              setIsReceivingMessage(false);
              const finalMessage: Message = {
                role: 'assistant',
                content: partialMessageRef.current,
                audioUrl: '',
                message_id: `bot-${Date.now()}`,
                timestamp: new Date().toISOString(),
                isPlaying: false
              };
              setMessages(prevMessages => [...prevMessages, finalMessage]);
              toggleAudio(finalMessage);
              setPartialMessage('');
              partialMessageRef.current = '';
            } else {
              setIsReceivingMessage(true);
              partialMessageRef.current += event.data;
              setPartialMessage(partialMessageRef.current);
            }
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

  async function generateTextToSpeech(message: Message) {
    try {
      const response = await axios.post(`${SPEECH_API_BASE_URL}/tts-proxy`, { text: message.content }, {
        headers: { 'Content-Type': 'application/json' },
        responseType: 'blob',
      });
      const audioBlob = new Blob([response.data as ArrayBuffer], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Set the message directly to the message passed as input
      setMessages(prevMessages => {
        return [
          ...prevMessages.slice(0, -1),
          { ...message, audioUrl }, // Update the message with audioUrl
        ];
      });

      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play().catch(error => {
          console.error('Playback failed:', error);
        });
        setMessages(prevMessages => 
          prevMessages.map(msg => 
            msg.message_id === message.message_id ? { ...msg, isPlaying: true } : msg
          )
        );
      }
    } catch (error) {
      console.error('Error generating text-to-speech:', error);
    }
  }

  const toggleAudio = (message: Message) => {
    if (!message.audioUrl) {
      generateTextToSpeech(message);
    } else {
      if (message.isPlaying) {
        if (audioRef.current) {
          audioRef.current.pause();
        }
        setMessages(prevMessages => 
          prevMessages.map(msg => 
            msg.message_id === message.message_id ? { ...msg, isPlaying: false } : msg
          )
        );
      } else {
        if (audioRef.current) {
          audioRef.current.src = message.audioUrl;
          audioRef.current.play().catch(error => {
            console.error('Playback failed:', error);
          });
        }
        setMessages(prevMessages => 
          prevMessages.map(msg => 
            msg.message_id === message.message_id ? { ...msg, isPlaying: true } : msg
          )
        );
      }
    }
  };

  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;
    audio.addEventListener('ended', () => {
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.isPlaying ? { ...msg, isPlaying: false } : msg
        )
      );
    });
    return () => {
      audio.removeEventListener('ended', () => {
        setMessages(prevMessages => 
          prevMessages.map(msg => 
            msg.isPlaying ? { ...msg, isPlaying: false } : msg
          )
        );
      });
    };
  }, []);

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
    </div>;
  }
  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto bg-white">
      <header className="p-4 border-b">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold">MathTutor</h1>
          <div className="flex items-center gap-2">
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
                      // Add a wrapper for paragraphs to avoid nesting issues
                      p: ({ children }) => (
                        <div>{children}</div>
                      ),
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                  {message.role === 'assistant' && (
                    <div className="mt-2 flex justify-end">
                      <Button 
                        size="sm"
                        variant="outline"
                        className="rounded px-2 py-1"
                        onClick={() => toggleAudio(message)}
                      >
                        {message.isPlaying ? <Pause className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                      </Button>
                    </div>
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
          {isReceivingMessage && partialMessage && (
            <div className="flex flex-col items-center">
              <div className="max-w-[80%] self-start">
                <div className="rounded-2xl p-4 bg-gray-200 text-gray-800">
                  <ReactMarkdown>
                    {partialMessage}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          )}
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