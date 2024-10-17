'use client'

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Send, Pause, Volume2, Square, Mic } from "lucide-react"
import { useSearchParams } from 'next/navigation'
import axios from 'axios'
import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks';
import { 
  Message, 
  StartChatResponse, 
  GetChatHistoryResponse,
  API_BASE_URL,
  SPEECH_API_BASE_URL,
} from '@/components/utils/chat_utils'

const SPEAKOUT = false;
const PLAYBACK_RATE = 1;


export function Chat() {
  const searchParams = useSearchParams();
  const username = searchParams.get('username') || 'testuser';
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [htmlContent, setHtmlContent] = useState("");
  const [chatId, setChatId] = useState("");
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const lastBotMessageRef = useRef<HTMLDivElement>(null);
  const chatWebsocketRef = useRef<WebSocket | null>(null);
  const messageStreamIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Text to Speech
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);

  // Speech to Text
  const sttAudioWebsocketRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [isRecording, setIsRecording] = useState(false);


  const generateTextToSpeech = useCallback(async (message: Message) => { // Wrapped in useCallback
    try {
      const response = await axios.post(`${SPEECH_API_BASE_URL}/openai-tts-proxy`, { text: message.content }, {
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

      if (ttsAudioRef.current) {
        ttsAudioRef.current.src = audioUrl;
        ttsAudioRef.current.playbackRate = PLAYBACK_RATE;
        ttsAudioRef.current.play().catch(error => {
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

  const generateHtml = useCallback(() => {
    const websocket = new WebSocket(`${process.env.NEXT_PUBLIC_WS_BASE_URL}/chat/generate_html/${username}`);

    setHtmlContent('');
    
    websocket.onopen = () => {
      console.log("WebSocket connection established for HTML generation");
    };

    websocket.onmessage = (event) => {
      setHtmlContent(prevHtml => prevHtml + event.data);
    };

    return () => {
      websocket.close();
    };
  }, [username]);

  const toggleAudio = useCallback((message: Message) => {
    if (!message.audioUrl) {
      generateTextToSpeech(message);
    } else {
      if (message.isPlaying) {
        ttsAudioRef.current?.pause();
        message.isPlaying = false;
        setMessages(prevMessages => 
          prevMessages.map(msg => 
            msg.message_id === message.message_id ? { ...msg, isPlaying: false } : msg
          )
        );
      } else {
        if (ttsAudioRef.current) {
          ttsAudioRef.current.src = message.audioUrl;
          ttsAudioRef.current.playbackRate = PLAYBACK_RATE;
          ttsAudioRef.current.play().catch(error => {
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
        `${process.env.NEXT_PUBLIC_WS_BASE_URL}/chat/handle_chat/${username}`
      );
      chatWebsocketRef.current.onopen = () => {
        console.log("Chat WebSocket connection established");
      }

      chatWebsocketRef.current.onmessage = async (event) => {
        const data = JSON.parse(event.data);
        const message = data.content;
        if (data.role === 'correction') {
          setMessages(prevMessages => prevMessages.slice(0, -1));
        }

        const finalMessage: Message = {
          role: 'assistant',
          content: '',
          audioUrl: '',
          message_id: `bot-${Date.now()}`,
          timestamp: new Date().toISOString(),
          isPlaying: false
        };

        // Clear the previous streaming interval if it exists
        if (messageStreamIntervalRef.current) {
          clearInterval(messageStreamIntervalRef.current);
        }

        // Stream the message content slowly
        const streamMessage = (fullMessage: string) => {
          let index = 0;
          messageStreamIntervalRef.current = setInterval(() => { // Store the interval ID
            if (index < fullMessage.length) {
              finalMessage.content += fullMessage[index++];
              setMessages(prevMessages => {
                const updatedMessages = prevMessages.filter(msg => msg.message_id !== finalMessage.message_id);
                return [...updatedMessages, finalMessage];
              });
            } else {
              clearInterval(messageStreamIntervalRef.current!);
              messageStreamIntervalRef.current = null; // Reset the ref
            }
          }, 0); // Adjust the speed of streaming here
        };

        streamMessage(message);

        if (SPEAKOUT) {
          console.log("Speking out the message");
          toggleAudio(finalMessage);
        }
      };
    }
  }, [toggleAudio]);

  const initAudioWebSocket = useCallback(() => {
    if (!sttAudioWebsocketRef.current) {
      sttAudioWebsocketRef.current = new WebSocket(
        `${process.env.NEXT_PUBLIC_WS_BASE_URL}/speech/transcribe`
      );
      sttAudioWebsocketRef.current.onopen = () => {
        console.log("Audio WebSocket connection established");
      }

      sttAudioWebsocketRef.current.onmessage = (event) => {
        const transcribedText = event.data;
        console.log("Transcribed text: ", transcribedText);
        setInputText(transcribedText);
      };

      sttAudioWebsocketRef.current.onclose = () => {
        console.log("Audio WebSocket connection closed");
      };

      sttAudioWebsocketRef.current.onerror = (error) => {
        console.error("Audio WebSocket error: ", error);
      };
    }
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);

      const audioChunks: Blob[] = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        if (sttAudioWebsocketRef.current?.readyState === WebSocket.OPEN) {
          sttAudioWebsocketRef.current?.send(audioBlob);
        }
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error accessing microphone: ' + err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };


  useEffect(() => {
    const initializeChat = async () => {
      try {
        if (chatId === "") {
          const response = await axios.post<StartChatResponse>(
            `${API_BASE_URL}/start_chat?user_id=${username}`,
            {},
            { headers: { 'Content-Type': 'application/json' } }
          );

          setChatId(response.data.chat_id);
          
          const historyResponse = await axios.get<GetChatHistoryResponse>(
            `${API_BASE_URL}/chat_history?user_id=${username}`,
            { headers: { 'Content-Type': 'application/json' } }
          );

          setMessages(historyResponse.data || []);
        }

        initChatWebSocket(username);
        initAudioWebSocket();
        
        return () => {
          sttAudioWebsocketRef.current?.close();
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
    ttsAudioRef.current = audio;
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
    const scrollElement = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (scrollElement) {
      scrollElement.scrollTo({
        top: scrollElement.scrollHeight,
        behavior: 'smooth' // Smooth scrolling effect
      });
    }
  }, [messages]);

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

    ttsAudioRef.current?.pause();
    resetIsPlaying();

    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInputText("");

    chatWebsocketRef.current?.send(inputText);
  }, [inputText]);

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
                : 'bg-gray-50 text-gray-800'
            } ${message.role === 'assistant' && index < messages.length - 1 ? 'opacity-50' : ''} 
            ${message.role === 'assistant' && index === messages.length - 1 ? 'opacity-100' : ''}`}
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkBreaks]}
              components={{
                h1: ({node, ...props}) => <h1 className="text-4xl font-bold my-4" {...props} />,
                h2: ({node, ...props}) => <h2 className="text-3xl font-bold my-3" {...props} />,
                h3: ({node, ...props}) => <h3 className="text-2xl font-bold my-2" {...props} />,
                p: ({node, ...props}) => <p className="" {...props} />,
                a: ({node, ...props}) => <a className="text-blue-500 underline" {...props} />,
                blockquote: ({node, ...props}) => <blockquote className="border-l-4 pl-4 italic text-gray-600" {...props} />,
                ul: ({node, ...props}) => <ul className="list-disc pl-5" {...props} />,
                ol: ({node, ...props}) => <ol className="list-decimal pl-5" {...props} />,
                br: () => <br key={Math.random()} />,
                img: ({ src, alt }) => (
                  <img
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
    <div className="flex h-screen mx-auto bg-white">
      <div className="w-1/2 flex flex-col p-4 border-r">
        <header className="p-4 border-b">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold">MathTutor</h1>
            <div className="flex items-center gap-2">
              <h3 className="text-lg text-gray-500">{username}</h3>
            </div>
          </div>
        </header>

        <ScrollArea ref={scrollAreaRef} className="flex-grow p-4">
          <div className="space-y-6">
            {messageComponents}
          </div>
        </ScrollArea>
        
        <div className="p-6 border-t flex items-center space-x-2">
          <Input 
            className="flex-grow h-12"
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
          <Button
              onClick={isRecording ? stopRecording : startRecording}
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${
                isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'
              }`}
              aria-label={isRecording ? 'Stop recording' : 'Start recording'}
            >
              {isRecording ? (
                <Square className="w-6 h-6 text-white" />
              ) : (
                <Mic className="w-6 h-6 text-white" />
              )}
            </Button>
            {isRecording && (
              <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2">
                <motion.div
                  className="flex space-x-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {[0, 1, 2, 3, 4].map((i) => (
                    <motion.div
                      key={i}
                      className="w-1 h-8 bg-blue-500 rounded-full"
                      animate={{
                        height: [8, 32, 8],
                      }}
                      transition={{
                        duration: 0.5,
                        repeat: Infinity,
                        repeatType: 'reverse',
                        delay: i * 0.1,
                      }}
                    />
                  ))}
                </motion.div>
              </div>
            )}
        </div>
      </div>
      <div className="w-1/2 p-4">
        <Button 
          className="mb-4" 
          onClick={generateHtml}
        >
          Generate HTML
        </Button>
        <iframe 
          srcDoc={htmlContent} 
          style={{ width: '100%', height: '95%', border: '2px solid #ccc', borderRadius: '4px' }} 
          title="Generated HTML"
        />
      </div>
    </div>
  );
}
