'use client'

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Send, Pause, Volume2, Square, Mic, PanelRightCloseIcon, PanelLeftCloseIcon } from "lucide-react"
import { useSearchParams } from 'next/navigation'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Message, 
  StartChatResponse, 
  GetChatHistoryResponse,
  API_BASE_URL,
  MarkdownComponent,
  SPEECH_API_BASE_URL,
} from '@/components/utils/chat_utils';
import UserVideo from '@/components/webrtc/user';
import { UserArtifactComponent } from '@/components/artifact/user';

const SPEAKOUT = true;
const SPEED = 30;
const PLAYBACK_RATE = 1;

const CORRECTION = 'correction';
const INTERRUPT = 'interrupt';
const ASSISTANT = 'assistant';
const USER = 'user';

const ERROR_TIMEOUT = 10000;

export function Chat() {
  const searchParams = useSearchParams();
  const username = searchParams.get('username') || 'testuser';

  const [showPopup, setShowPopup] = useState(true);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatId, setChatId] = useState("");
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [sendMessageTimeout, setSendMessageTimeout] = useState<NodeJS.Timeout | null>(null);

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const lastBotMessageRef = useRef<HTMLDivElement>(null);

  const chatWebsocketRef = useRef<WebSocket | null>(null);
  const messageStreamIntervalRef = useRef<NodeJS.Timeout | null>(null);

  
  // Text to Speech
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);

  // Speech to Text
  const [isRecording, setIsRecording] = useState(false);
  const sttAudioWebsocketRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const [isVideoVisible, setIsVideoVisible] = useState(true); // State to manage visibility
  
  const toggleVideoFeed = () => {
    setIsVideoVisible(prev => !prev); // Toggle visibility
  };

  const handleEnterClass = () => {
    if (username.trim() === "") {
      setErrorMessage("Please enter your name")
      return
    }
    setShowPopup(false)
  }

  const getTTS = useCallback(async (message: string): Promise<string> => {
    let audioUrl = '';
    try {
      const response = await axios.post(`${SPEECH_API_BASE_URL}/openai-tts-proxy`, { text: message }, {
        headers: { 'Content-Type': 'application/json' },
        responseType: 'blob',
      });
      const audioBlob = new Blob([response.data as ArrayBuffer], { type: 'audio/mpeg' });
      audioUrl = URL.createObjectURL(audioBlob);
      console.log('Audio blob generated:', audioUrl);
    } catch (error) {
      console.error('Error generating text-to-speech:', error);
    }
    return audioUrl;
  }, []);

  const setMessageAudioAndPlay = useCallback(async (message: Message, audioUrl: string) => {
    if (message.isImage) return;

    try {
      setMessages(prevMessages => [
        ...prevMessages.slice(0, -1),
        { ...message, audioUrl },
      ]);

      if (ttsAudioRef.current) {
        ttsAudioRef.current.src = audioUrl;
        ttsAudioRef.current.playbackRate = PLAYBACK_RATE;
        await ttsAudioRef.current.play();
        setMessages(prevMessages => 
          prevMessages.map(msg => 
            msg.message_id === message.message_id ? { ...msg, isPlaying: true } : msg
          )
        );
      }
    } catch (error) {
      console.error('Playback failed:', error);
    }
  }, []);

  const toggleAudio = useCallback(async (message: Message) => {
    if (!message.audioUrl && !message.isImage) {
      const audioUrl = await getTTS(message.content);
      setMessageAudioAndPlay(message, audioUrl);
    } else {
      const isPlaying = message.isPlaying;
      console.log(`${isPlaying ? 'Pausing' : 'Playing'} audio for message ID:`, message.message_id);
      
      if (isPlaying) {
        ttsAudioRef.current?.pause();
      } else {
        if (message.audioUrl) {
          await setMessageAudioAndPlay(message, message.audioUrl);
        } else {
          const audioUrl = await getTTS(message.content);
          await setMessageAudioAndPlay(message, audioUrl);
        }
      }
      
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.message_id === message.message_id ? { ...msg, isPlaying: !isPlaying } : msg
        )
      );
    }
  }, [setMessageAudioAndPlay, getTTS]);

  const initChatWebSocket = useCallback(async (username: string) => {
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
        const role = data.role;

        if (role === INTERRUPT) {
          ttsAudioRef.current?.pause();
          return;
        }

        const isImage = message.startsWith("![Generated");
        const audioUrl = isImage ? '' : (SPEAKOUT ? await getTTS(message) : ''); 

        if (role === CORRECTION) {
          setMessages(prevMessages => prevMessages.slice(0, -1));
        }

        setIsSendingMessage(false);
        setErrorMessage(null);
        if (sendMessageTimeout) {
          clearTimeout(sendMessageTimeout);
          setSendMessageTimeout(null);
        }

        const finalMessage: Message = {
          role: ASSISTANT,
          content: '',
          audioUrl: '',
          message_id: `bot-${Date.now()}`,
          timestamp: new Date().toISOString(),
          isPlaying: false,
          isImage: isImage
        };

        if (isImage) {
          finalMessage.content = message; 
          setMessages(prevMessages => {
            const updatedMessages = prevMessages.filter(msg => msg.message_id !== finalMessage.message_id);
            return [...updatedMessages, finalMessage];
          });
        } else {
          if (messageStreamIntervalRef.current) {
            clearInterval(messageStreamIntervalRef.current);
          }

          const streamMessage = (fullMessage: string) => {
            const messageChunks = fullMessage.split(' ');
            let index = 0;
            messageStreamIntervalRef.current = setInterval(() => {
              if (index < messageChunks.length) {
                finalMessage.content += messageChunks[index++] + ' ';
                setMessages(prevMessages => {
                  const updatedMessages = prevMessages.filter(msg => msg.message_id !== finalMessage.message_id);
                  return [...updatedMessages, finalMessage];
                });
              } else {
                clearInterval(messageStreamIntervalRef.current!);
                messageStreamIntervalRef.current = null; 
                if (SPEAKOUT) {
                  console.log("Speaking out the message...", finalMessage);
                  setMessageAudioAndPlay(finalMessage, audioUrl);
                }
              }
            }, SPEED);
          };
          streamMessage(message);
        }
      }
    }
  }, [getTTS, setMessageAudioAndPlay]);


  const initAudioWebSocket = useCallback(() => {
    if (!sttAudioWebsocketRef.current) {
      sttAudioWebsocketRef.current = new WebSocket(
        `${process.env.NEXT_PUBLIC_WS_BASE_URL}/speech/transcribe/deepgram/${username}`
      );
      sttAudioWebsocketRef.current.onopen = () => {
        console.log("Audio WebSocket connection established");
      }

      sttAudioWebsocketRef.current.onmessage = (event) => {
        const transcribedText = event.data;
        setInputText(prevText => prevText + ' ' + transcribedText);
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
      if (ttsAudioRef.current && !ttsAudioRef.current.paused) {
        ttsAudioRef.current.pause();
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error accessing microphone:', err);
    }
  };

  const stopRecording = () => {
    if (isRecording && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        audioChunksRef.current = [];

        if (sttAudioWebsocketRef.current?.readyState === WebSocket.OPEN) {
          sttAudioWebsocketRef.current.send(audioBlob);
        }

        mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
      };
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
          
          sttAudioWebsocketRef.current = null;
          chatWebsocketRef.current = null;
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
    if (sttAudioWebsocketRef.current === null) {
      stopRecording();
    }
  }, [sttAudioWebsocketRef, stopRecording]);

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
        behavior: 'smooth' 
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
      role: USER,
      content: inputText,
      audioUrl: '',
      message_id: `temp-${Date.now()}`,
      timestamp: new Date().toISOString()
    };

    ttsAudioRef.current?.pause();
    resetIsPlaying();

    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInputText("");
    setIsSendingMessage(true);
    setErrorMessage(null);
    const timeout = setTimeout(() => {
      setErrorMessage("Try reloading the page...");
    }, ERROR_TIMEOUT);
    setSendMessageTimeout(timeout);

    chatWebsocketRef.current?.send(inputText);
  }, [inputText]);

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
                ? 'bg-blue-500 text-white'
                : 'bg-gray-50 text-gray-800'
            } ${message.role === ASSISTANT && index < messages.length - 1 ? 'opacity-50' : ''} 
            ${message.role === ASSISTANT && index === messages.length - 1 ? 'opacity-100' : ''}`}
          >
            <MarkdownComponent content={message.content} />
            {message.role === ASSISTANT && (
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
    <div className="flex flex-col lg:flex-row h-screen bg-background">
      <AnimatePresence>
        {showPopup && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute inset-0 flex items-center justify-center bg-black/50 z-50"
          >
            <motion.div
              className="bg-card p-8 rounded-lg shadow-lg w-full max-w-md"
              initial={{ y: -50 }}
              animate={{ y: 0 }}
            >
              <h2 className="text-2xl font-bold mb-4">Welcome to MathTutor</h2>
              <Button onClick={handleEnterClass} className="w-full">
                Enter Class
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {!showPopup && (
        <React.Fragment>
          <div className="w-full lg:w-1/2 flex flex-col p-4 border-r border-border">
            <header className="p-4 border-b border-border">
              <div className="flex justify-between items-center">
                <h1 className="text-xl font-bold">MathTutor</h1>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg text-muted-foreground">{username}</h3>
                </div>
              </div>
            </header>

            <ScrollArea ref={scrollAreaRef} className="flex-grow p-4">
              <div className="space-y-6">
                {messageComponents}
              </div>
            </ScrollArea>
            
            {isSendingMessage ? (
              <div className="flex items-center justify-center h-12 w-full">
                {errorMessage ? (
                  <div className="mt-4 text-destructive">
                    {errorMessage}
                  </div>
                ) : (
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                )}
              </div>
            ) : (
              <div className="p-4 border-t border-border flex items-center space-x-2">
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
                <div className="relative">
                  <Button
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${
                      isRecording ? 'bg-destructive hover:bg-destructive/90' : 'bg-blue-500 hover:bg-blue-400'
                    }`}
                    aria-label={isRecording ? 'Stop recording' : 'Start recording'}
                  >
                    {isRecording ? (
                      <Square className="w-8 h-8 text-blue-foreground" />
                    ) : (
                      <Mic className="w-8 h-8 text-blue-foreground" />
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
                            className="w-1 h-8 bg-primary rounded-full"
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
            )}
          </div>

          <UserArtifactComponent username={username}/>
          
          <div className="fixed right-4 top-4 lg:w-64 lg:h-48 w-32 h-24">
            <UserVideo 
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

        </React.Fragment>
      )}
    </div>
  );
}
