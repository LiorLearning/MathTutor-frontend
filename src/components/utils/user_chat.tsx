'use client'

import React, { useState, useRef, useEffect, useCallback, useMemo, useContext } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Pause, Volume2, Square, Mic, PanelRightCloseIcon, PanelLeftCloseIcon, ChevronLeft, ChevronRight, Send } from "lucide-react"
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Message, 
  StartChatResponse, 
  GetChatHistoryResponse,
  API_BASE_URL,
  MarkdownComponent,
} from '@/components/utils/chat_utils';
import UserVideo from '@/components/webrtc/user';
import { UserArtifactComponent } from '@/components/artifact/user';
import { AudioContext } from '@/components/utils/audio_stream';

const SPEAKOUT = true;
const SPEED = 30;
const PAGE_SIZE = 10;

const CORRECTION = 'correction';
const INTERRUPT = 'interrupt';
const ASSISTANT = 'assistant';
const USER = 'user';
const PAUSE = 'pause';
const NOTEXT = 'notext';

const RETHINKING_MESSAGE = "Rethinking..."

export function UserChat({ username }: { username: string }) {
  const audioContext = useContext(AudioContext);
  if (!audioContext) {
    throw new Error('MessageCard must be used within an AudioProvider');
  }

  const { 
    isConnected,
    wsRef,
    audioContextRef,
    scheduledAudioRef,
    nextStartTimeRef,
    isFirstChunkRef,
  } = audioContext;

  const [showPopup, setShowPopup] = useState(false);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatId, setChatId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [sendMessageTimeout, setSendMessageTimeout] = useState<NodeJS.Timeout | null>(null);
  const [textInput, setTextInput] = useState("");

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const lastBotMessageRef = useRef<HTMLDivElement>(null);

  const chatWebsocketRef = useRef<WebSocket | null>(null);
  const messageStreamIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const isLastMessagePauseRef = useRef<boolean>(false);

  // Text to Speech
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);

  // Speech to Text
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const [isVideoVisible, setIsVideoVisible] = useState(true);

  const [isRightColumnCollapsed, setIsRightColumnCollapsed] = React.useState(true);
  const isRightColumnCollapsedRef = useRef<boolean>(isRightColumnCollapsed);

  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [initialScrollComplete, setInitialScrollComplete] = useState(false);

  const previousScrollHeight = useRef(0);

  const loadMoreMessages = async () => {
    if (isLoadingMore || !hasMore) return;

    try {
      setIsLoadingMore(true);
      const nextPage = currentPage + 1;
      
      const historyResponse = await axios.get<GetChatHistoryResponse>(
        `${API_BASE_URL}/chat_history?user_id=${username}`,
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (historyResponse.data.length === 0) {
        setHasMore(false);
        return;
      }

      // Save the current scroll height before adding new messages
      const scrollElement = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        previousScrollHeight.current = scrollElement.scrollHeight;
      }

      setMessages(prevMessages => [...historyResponse.data, ...prevMessages]);
      setCurrentPage(nextPage);
    } catch (error) {
      console.error('Error loading more messages:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const toggleRightColumn = () => {
    setIsRightColumnCollapsed(prev => {
      const newState = !prev; // Toggle the state
      isRightColumnCollapsedRef.current = newState; // Update the ref
      return newState;
    });
  };
  
  const toggleVideoFeed = () => {
    setIsVideoVisible(prev => !prev); // Toggle visibility
  };

  const handleEnterClass = () => {
    setShowPopup(false)
  }

  const handleStopAudio = (message: Message) => {
    const messageId = message.message_id
    if (audioContextRef.current && scheduledAudioRef.current[messageId]) {
      scheduledAudioRef.current[messageId].forEach(({ source, gain }) => {
        try {
          source.stop();
          source.disconnect();
          gain.disconnect();
        } catch (e) {
          // Ignore errors from already stopped sources
        }
      });
      scheduledAudioRef.current[messageId] = [];
      
      isFirstChunkRef.current[messageId] = true;
      nextStartTimeRef.current[messageId] = audioContextRef.current.currentTime;
    }
  };

  const handlePlayAudio = (message: Message) => {
    const messageId = message.message_id
    const messageText = message.content

    if (!messageText.trim()) {
      return;
    }
    
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    if (audioContextRef.current) {
      nextStartTimeRef.current[messageId] = audioContextRef.current.currentTime;
    }

    wsRef.current.send(JSON.stringify({
      type: 'tts_request',
      text: messageText.trim(),
      id: messageId,
    }));
  }

  const toggleAudio = useCallback(async (message: Message) => {
    if (message.isImage) {
      return
    }

    if (message.audioUrl) {
      console.log("Not implemented error")
    } else {
      const isPlaying = message.isPlaying;
      console.log(`${isPlaying ? 'Pausing' : 'Playing'} audio for message ID:`, message.message_id);

      if (isPlaying) {
        handleStopAudio(message);
      } else {
        handlePlayAudio(message);
      }

      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.message_id === message.message_id ? { ...msg, isPlaying: !isPlaying } : msg
        )
      );
    }
  }, []);

  const initChatWebSocket = useCallback(async (username: string) => {
    if (!chatWebsocketRef.current) {
      chatWebsocketRef.current = new WebSocket(
        `${process.env.NEXT_PUBLIC_WS_BASE_URL}/chat/handle_chat/${username}`
      );
      chatWebsocketRef.current.onopen = () => {
        console.log("Chat WebSocket connection established");
      }

      chatWebsocketRef.current.onmessage = async (event) => {
        console.log("WebSocket message received:", event.data); // Log the received event data

        const data = JSON.parse(event.data);
        const message = data.content;
        const role = data.role;
        console.log("Parsed message content:", message, "Role:", role); // Log parsed message and role

        switch (role) {
          case NOTEXT:
            console.log("No text received, setting isSendingMessage to false.");
            setIsSendingMessage(false);
            return;

          case PAUSE:
            console.log("Received PAUSE signal, setting rethinking state to true.");
            isLastMessagePauseRef.current = true;
            setMessages(prevMessages => {
                if (prevMessages[prevMessages.length - 1]?.role === ASSISTANT) {
                    return prevMessages.slice(0, -1);
                }
                return prevMessages;
            });
            setMessages(prevMessages => [
              ...prevMessages,
              { 
                role: ASSISTANT, 
                content: RETHINKING_MESSAGE,
                message_id: `bot-${Date.now()}`, 
                timestamp: new Date().toISOString(),
                audioUrl: '' 
              }
            ]);
            return;

          case USER:
            console.log("User message received:", message);
            const userMessage: Message = {
              role: USER,
              content: message,
              audioUrl: '',
              message_id: `temp-${Date.now()}`,
              timestamp: new Date().toISOString()
            };
            setMessages(prevMessages => [...prevMessages, userMessage]);
            return;

          case INTERRUPT:
            console.log("Received INTERRUPT signal, pausing audio.");
            ttsAudioRef.current?.pause();
            return;

          case CORRECTION:
            setMessages(prevMessages => prevMessages.slice(0, -1));
            isLastMessagePauseRef.current = false;
            break;

          default:
            console.log("Unknown role received:", role);
            break;
        }

        const isImage = message.startsWith("![Generated");

        setIsSendingMessage(false);
        if (sendMessageTimeout) {
          clearTimeout(sendMessageTimeout);
          setSendMessageTimeout(null);
        }

        const tempMessage: Message = {
          role: ASSISTANT,
          content: '',
          audioUrl: '',
          message_id: `bot-${Date.now()}`,
          timestamp: new Date().toISOString(),
          isPlaying: false,
          isImage: isImage
        };

        const finalMessage = JSON.parse(JSON.stringify(tempMessage));

        tempMessage.content = message;
        handlePlayAudio(tempMessage);

        if (isImage) {
          finalMessage.content = message; 
          if (isLastMessagePauseRef.current) {
            return;
          }
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
              if (isLastMessagePauseRef.current) {
                clearInterval(messageStreamIntervalRef.current!);
                messageStreamIntervalRef.current = null; 
                return;
              }

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
                }
              }
            }, SPEED);
          };
          streamMessage(message);
        }
      }
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

        handleSendMessage(audioBlob);

        mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
      };
    }
  };

  const handleTextSend = async () => {
    if (textInput.trim() === "") return; // Prevent sending empty messages

    // Dummy message
    if (chatWebsocketRef.current?.readyState == WebSocket.OPEN) {
      chatWebsocketRef.current.send(textInput);
    }

    handleSendMessage(textInput);

    const userMessage: Message = {
      role: USER,
      content: textInput,
      audioUrl: '',
      message_id: `temp-${Date.now()}`,
      timestamp: new Date().toISOString()
    };

    setMessages(prevMessages => [...prevMessages, userMessage]);
    setTextInput(""); // Clear the input after sending
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
            `${API_BASE_URL}/chat_history?user_id=${username}&page=1&page_size=${PAGE_SIZE}`,
            { headers: { 'Content-Type': 'application/json' } }
          );

          setMessages(historyResponse.data);
          setHasMore(historyResponse.data.length === PAGE_SIZE);
        }

        initChatWebSocket(username);
        
        return () => {
          chatWebsocketRef.current?.close();
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

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log("Visibility changed to visible - Reinitializing WebSocket");
        initChatWebSocket(username);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    }

  }, [username, chatId, initChatWebSocket]);

  useEffect(() => {
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

    const handleUnload = () => {
      cleanup();
    };

    const handleLoad = async () => {
      console.log("Handle load - WebSocket initialization");
      await initChatWebSocket(username);
    };

    window.addEventListener('beforeunload', handleUnload);
    window.addEventListener('load', handleLoad);
    
    // Call handleLoad only when the component mounts
    handleLoad();

    return () => {
      cleanup();
      window.removeEventListener('beforeunload', handleUnload);
      window.removeEventListener('load', handleLoad);
    }
  }, [username, initChatWebSocket])

  useEffect(() => {
    if (chatWebsocketRef.current === null) {
      stopRecording();
    }
  }, [chatWebsocketRef, stopRecording]);

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
    if (!scrollElement) return;

    if (!initialScrollComplete) {
      // Initial scroll to bottom for new chat
      scrollElement.scrollTo({
        top: scrollElement.scrollHeight,
        behavior: 'auto'
      });
      setInitialScrollComplete(true);
    } else {
      // Maintain scroll position when loading older messages
      const newScrollPosition = scrollElement.scrollHeight - previousScrollHeight.current;
      if (newScrollPosition > 0) {
        scrollElement.scrollTop = newScrollPosition;
      }
    }
  }, [messages, initialScrollComplete]);

  useEffect(() => {
    const scrollElement = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (!scrollElement) return;

    const handleScroll = () => {
      // Load more when user scrolls near the top (e.g., within 100px)
      if (scrollElement.scrollTop < 100 && !isLoadingMore && hasMore) {
        loadMoreMessages();
      }
    };

    scrollElement.addEventListener('scroll', handleScroll);
    return () => scrollElement.removeEventListener('scroll', handleScroll);
  }, [isLoadingMore, hasMore]);

  const resetIsPlaying = () => {
    setMessages(prevMessages => 
      prevMessages.map(msg => ({ ...msg, isPlaying: false }))
    );
  };

  const handleSendMessage = useCallback(async (message: Blob | string) => {
    if (chatWebsocketRef.current?.readyState == WebSocket.OPEN) {
      chatWebsocketRef.current.send(message);
    }

    ttsAudioRef.current?.pause();
    resetIsPlaying();

    setIsSendingMessage(true);
  }, []);

  const messageComponents = useMemo(() => {
    return (
      <>
        {isLoadingMore && (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        )}
        {Array.isArray(messages) && messages.map((message, index) => (
          (message.role == USER || message.role == ASSISTANT) && (
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
                    : 'bg-gray-50 text-gray-800'
                } ${message.role === ASSISTANT && index === messages.length - 1 ? 'opacity-100' : ''}`}
              >
                {message.content === RETHINKING_MESSAGE && index === messages.length - 1 ? (
                  <div className="flex items-center justify-center bg-gray-50 rounded-lg px-32">
                    <motion.div
                      className="flex flex-col items-center gap-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5 }}
                    >
                      <motion.div
                        className="text-lg font-medium text-gray-600"
                        initial={{ scale: 1 }}
                        animate={{ 
                          opacity: [0.5, 1, 0.5]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        Rethinking...
                      </motion.div>
                      
                      {/* Subtle Dots Animation */}
                      <div className="flex gap-1"> {/* Reduced gap */}
                        {[0, 1, 2].map((i) => (
                          <motion.div
                            key={i}
                            className="w-2 h-2 bg-blue-500 rounded-full"
                            initial={{ scale: 0.8, opacity: 0.5 }}
                            animate={{ 
                              scale: [0.8, 1.2, 0.8],
                              opacity: [0.5, 1, 0.5]
                            }}
                            transition={{
                              duration: 1,
                              repeat: Infinity,
                              delay: i * 0.2,
                              ease: "easeInOut"
                            }}
                          />
                        ))}
                      </div>
                    </motion.div>
                  </div>
                ) : (
                  <>
                    <MarkdownComponent content={message.content} />
                  </>
                ) }
                
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
          )
        ))}
      </>
    );
  }, [messages, toggleAudio, isLoadingMore]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
    </div>;
  }
  return (
    <div className="flex h-screen overflow-hidden bg-background">
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
          <motion.div
            className="flex-1 p-6 transition-all duration-200 ease-in-out"
            animate={{
              marginRight: isRightColumnCollapsed ? "15%" : "50%",
              marginLeft: isRightColumnCollapsed ? "15%": "0%",
            }}
          >
            <div className="h-full flex flex-col p-4 border-r border-border">
              <header className="p-4 border-b border-border">
                <div className="flex justify-between items-center">
                  <h1 className="text-xl font-bold">MathTutor</h1>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg text-muted-foreground">{username}</h3>
                    {isConnected && (
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    )}
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
                  {/* <MessageLoader /> */}
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="p-4 border-t border-border flex items-center justify-center">
                  <div className="relative flex flex-col items-center">
                    <AnimatePresence>
                      {isRecording ? (
                        <motion.div
                          key="recording"
                          className="absolute -top-16"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                        >
                          <div className="flex space-x-1">
                            {[...Array(5)].map((_, i) => (
                              <motion.div
                                key={i}
                                className="w-1 bg-primary rounded-full"
                                animate={{
                                  height: [8, 32, 16, 24, 8],
                                }}
                                transition={{
                                  duration: 1.5,
                                  repeat: Infinity,
                                  repeatType: "reverse",
                                  ease: "easeInOut",
                                  delay: i * 0.2,
                                }}
                              />
                            ))}
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="not-recording"
                          className="absolute -top-12"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                        >
                          <motion.div
                            className="w-4 h-4 bg-muted-foreground rounded-full"
                            animate={{
                              scale: [1, 1.2, 1],
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: "easeInOut",
                            }}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                    
                    <div className="flex flex-col items-center gap-4 max-w-xs mx-auto">
                      <div className="flex justify-center w-1/2">
                        <Button
                          onClick={isRecording ? stopRecording : startRecording}
                          className={`w-full h-12 rounded-full flex items-center justify-center transition-colors ${
                            isRecording ? "bg-destructive hover:bg-destructive/90" : "bg-primary hover:bg-primary/90"
                          }`}
                          aria-label={isRecording ? "Stop recording" : "Start recording"}
                        >
                          <AnimatePresence mode="wait">
                            <motion.div
                              key={isRecording ? "stop" : "start"}
                              initial={{ opacity: 0, scale: 0.5 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.5 }}
                              transition={{ duration: 0.2 }}
                            >
                              {isRecording ? (
                                <Square className="w-8 h-8 text-destructive-foreground" />
                              ) : (
                                <Mic className="w-8 h-8 text-primary-foreground" />
                              )}
                            </motion.div>
                          </AnimatePresence>
                        </Button>
                      </div>
                      
                      <div className="relative w-1/2">
                        <input
                          type="text"
                          value={textInput}
                          onChange={(e) => setTextInput(e.target.value)}
                          placeholder="Type"
                          className="w-full text-black placeholder-gray-400 rounded-2xl px-4 py-3 pr-12 text-xs focus:outline-none focus:ring-2 focus:ring-gray-600 border border-gray-600"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleTextSend();
                            }
                          }}
                        />
                        <button
                          onClick={handleTextSend}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors"
                          aria-label="Send message"
                        >
                          <Send size={20} />
                        </button>
                      </div>
                    </div>
                    {/* <AudioStreamer /> */}
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          <motion.div
            className="fixed right-0 top-0 h-full w-[50%] bg-secondary p-6 shadow-lg transition-all duration-200 ease-in-out"
            animate={{
              x: isRightColumnCollapsed ? "100%" : "0%",
            }}
          >
            <UserArtifactComponent 
            username={username} 
            isRightColumnCollapsed={isRightColumnCollapsedRef}
            toggleRightColumn={toggleRightColumn} />
          </motion.div>

          <div className="fixed right-4 top-4 w-[15vw] h-[12vh] max-w-[256px] max-h-[192px]">
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

          <Button
            className="fixed bottom-4 right-4 z-10"
            onClick={toggleRightColumn}
            aria-label={isRightColumnCollapsed ? "Expand right column" : "Collapse right column"}
          >
            {isRightColumnCollapsed ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </React.Fragment>
      )}
    </div>
  );
}
