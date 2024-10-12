'use client'

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Send, Pause, Volume2 } from "lucide-react"
import { useSearchParams } from 'next/navigation'
import axios from 'axios'
import ReactMarkdown from 'react-markdown'
import { 
  Message, 
  StartChatResponse, 
  GetChatHistoryResponse,
  API_BASE_URL,
  SPEECH_API_BASE_URL,
  MyImageComponent,
} from '@/components/utils/chat_utils'

const SPEAKOUT = false;
const PLAYBACK_RATE = 1;

export function Chat() {
  const searchParams = useSearchParams();
  const username = searchParams.get('username') || 'testuser';
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatId, setChatId] = useState("");
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const lastBotMessageRef = useRef<HTMLDivElement>(null);
  const stt_audioWebsocketRef = useRef<WebSocket | null>(null);
  const chatWebsocketRef = useRef<WebSocket | null>(null);

  const generateTextToSpeech = useCallback(async (message: Message) => { // Wrapped in useCallback
    try {
      const response = await axios.post(`${SPEECH_API_BASE_URL}/google-tts-proxy`, { text: message.content }, {
        headers: { 'Content-Type': 'application/json' },
        responseType: 'blob',
      });
      const audioBlob = new Blob([response.data as ArrayBuffer], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      
      setMessages(prevMessages => {
        return [
          ...prevMessages.slice(0, -1),
          { ...message, audioUrl },
        ];
      });

      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.playbackRate = PLAYBACK_RATE;
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
  }, []); // Add dependencies if needed

  const toggleAudio = useCallback((message: Message) => {
    if (!message.audioUrl) {
      generateTextToSpeech(message);
    } else {
      if (message.isPlaying) {
        audioRef.current?.pause();
        message.isPlaying = false;
        setMessages(prevMessages => 
          prevMessages.map(msg => 
            msg.message_id === message.message_id ? { ...msg, isPlaying: false } : msg
          )
        );
      } else {
        if (audioRef.current) {
          audioRef.current.src = message.audioUrl;
          audioRef.current.playbackRate = PLAYBACK_RATE;
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
  }, [generateTextToSpeech]);

  const initChatWebSocket = useCallback((username: string) => {
    if (!chatWebsocketRef.current) {
      chatWebsocketRef.current = new WebSocket(
        `${process.env.NEXT_PUBLIC_WS_BASE_URL}/handle_chat/${username}`
      );
      chatWebsocketRef.current.onopen = () => {
        console.log("Chat WebSocket connection established");
      }

      chatWebsocketRef.current.onmessage = async (event) => {
        const data = JSON.parse(event.data);
        const message = data.content;
        if (data.role === 'correction') {
          setMessages(prevMessages => prevMessages.slice(0, -1));
        } else {
          console.error("Error: Unrecognized role received in WebSocket message:", data.role);
        }

        const finalMessage: Message = {
          role: 'assistant',
          content: message,
          audioUrl: '',
          message_id: `bot-${Date.now()}`,
          timestamp: new Date().toISOString(),
          isPlaying: false
        };
        setMessages(prevMessages => [...prevMessages, finalMessage]);
        if (SPEAKOUT) {
          toggleAudio(finalMessage);
        }
      };
    }
  }, [toggleAudio]);

  const initAudioWebSocket = useCallback(() => {
    if (!stt_audioWebsocketRef.current) {
      stt_audioWebsocketRef.current = new WebSocket(
        `${process.env.NEXT_PUBLIC_WS_BASE_URL}/transcribe`
      );
      stt_audioWebsocketRef.current.onopen = () => {
        console.log("Audio WebSocket connection established");
      }

      stt_audioWebsocketRef.current.onmessage = (event) => {
        const transcribedText = event.data;
        console.log("Transcribed text: ", transcribedText);
        setInputText(transcribedText);
      };
    }
  }, []);

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

        initChatWebSocket(username);
        initAudioWebSocket();
        
        return () => {
          stt_audioWebsocketRef.current?.close();
          chatWebsocketRef.current?.close();
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

    const cleanup = async () => {
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

    const saveChat = async () => {
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

    const handleLoad = () => {
      initChatWebSocket(username);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        saveChat();
      } else if (document.visibilityState === 'visible') {
        initChatWebSocket(username);
      }
    };

    window.addEventListener('beforeunload', handleUnload);
    window.addEventListener('load', handleLoad);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      cleanup();
      window.removeEventListener('beforeunload', handleUnload);
      window.removeEventListener('load', handleLoad);
      document.removeEventListener('visibilitychange', handleVisibilityChange);      
    }

  }, [username, chatId, initChatWebSocket, initAudioWebSocket]);

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
      setMessages([]);
      console.log("Chat deleted successfully.");
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
  };

  const resetIsPlaying = () => {
    setMessages(prevMessages => 
      prevMessages.map(msg => ({ ...msg, isPlaying: false }))
    );
  };

  const handleSendMessage = useCallback(async () => {
    if (inputText.trim() === "") return;

    const userMessage: Message = {
      role: 'user',
      content: inputText,
      message_id: `temp-${Date.now()}`,
      timestamp: new Date().toISOString()
    };

    audioRef.current?.pause();
    resetIsPlaying();

    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInputText("");

    chatWebsocketRef.current?.send(inputText);
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
    ))
  ), [messages, toggleAudio]);

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
  );
}
