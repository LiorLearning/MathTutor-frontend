'use client'

import React, { useState, useRef, useEffect } from 'react'
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Send, Mic, Volume2, VolumeX } from "lucide-react"
import { useSearchParams } from 'next/navigation'
import axios from 'axios'

// Complete Web Speech API TypeScript declarations
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
  interpretation: any;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onaudioend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onaudiostart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onnomatch: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onsoundend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onsoundstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onspeechend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onspeechstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
  prototype: SpeechRecognition;
}


declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionConstructor;
    webkitSpeechRecognition: SpeechRecognitionConstructor;
  }
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  message_id: string;
}

interface StartChatRequest {
  username: string;
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
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const lastBotMessageRef = useRef<HTMLDivElement>(null);
  const audioWebsocketRef = useRef<WebSocket | null>(null);
  const chatWebsocketRef = useRef<WebSocket | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Initialize speech recognition
  useEffect(() => {
    console.log("Window: ", window);
    if (typeof window !== 'undefined') {
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognitionAPI) {
        recognitionRef.current = new SpeechRecognitionAPI();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;

        recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
          const transcript = Array.from(event.results)
            .map(result => result[0])
            .map(result => result.transcript)
            .join('');
          
          setInputText(transcript);
        };

        recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);

          if (event.error === 'network') {
            alert('Network error: Please check your internet connection.');
          }
        };

        // Update the onend event to restart recognition
        recognitionRef.current.onend = () => {
          if (isListening) {
            recognitionRef.current?.start(); // Restart recognition if still listening
          }
        };
      }
    }
  }, [isListening]);

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
        }

        if (!audioWebsocketRef.current) {
          audioWebsocketRef.current = new WebSocket(
            `${process.env.NEXT_PUBLIC_WS_BASE_URL}/transcribe`
          );
          audioWebsocketRef.current.onopen = () => {
            console.log("Audio WebSocket connection established");
          }
        }
        

        audioWebsocketRef.current.onmessage = (event) => {
          const botMessage: Message = {
            role: 'assistant',
            content: event.data,
            message_id: `bot-${Date.now()}`,
            timestamp: new Date().toISOString()
          };
          setMessages(prevMessages => [...prevMessages, botMessage]);
          
          // Speak the response if not already speaking
          if (!isSpeaking) {
            speakMessage(event.data);
          }
        };
      } catch (error) {
        console.error('Error initializing chat:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeChat();

    // Cleanup function
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (audioWebsocketRef.current) {
        audioWebsocketRef.current.close();
      }
      if (chatWebsocketRef.current) {
        chatWebsocketRef.current.close();
      }
      window.speechSynthesis.cancel();
    };
  }, [username]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (lastBotMessageRef.current) {
      lastBotMessageRef.current.scrollIntoView({ behavior: 'smooth' });
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
    setInputText("");

    if (chatWebsocketRef.current) {
      chatWebsocketRef.current.send(inputText);
      
      // Fetch the message from the websocket and update the messages
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
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in your browser");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
    setIsListening(!isListening);
  };

  const speakMessage = (text: string) => {
    if ('speechSynthesis' in window) {
      setIsSpeaking(true);
      const utterance = new SpeechSynthesisUtterance(text);
      
      utterance.onend = () => {
        setIsSpeaking(false);
      };

      utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
        console.error('Speech synthesis error:', event);
        setIsSpeaking(false);
      };

      window.speechSynthesis.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
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
            <Button
              size="icon"
              variant="ghost"
              onClick={isSpeaking ? stopSpeaking : () => {}}
              className={isSpeaking ? 'text-blue-500' : 'text-gray-500'}
            >
              {isSpeaking ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </Button>
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
          className={`mr-2 transition-all duration-1000 ease-in-out w-24 h-12 ${
            isListening 
              ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
              : 'bg-blue-500 hover:bg-blue-600'
          }`}
          onClick={toggleListening}
        >
          <Mic className="h-5 w-5" />
        </Button>
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