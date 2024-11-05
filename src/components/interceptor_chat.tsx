'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ScrollArea } from "./ui/scroll-area"
import { Textarea } from './ui/textarea';
import { Button } from "./ui/button"
import { useSearchParams } from 'next/navigation'
import axios from 'axios'
import { Send, User, PanelRightCloseIcon, PanelLeftCloseIcon } from "lucide-react"

import { 
  Message, 
  GetChatHistoryResponse,
  API_BASE_URL,
} from './utils/chat/chat_utils'
import MessageComponents from './utils/admin/messages';

import AdminVideo from './webrtc/admin';
import { AdminArtifactComponent } from './artifact/admin';

const USER = 'user';
const ASSISTANT = 'assistant';
const CORRECTION = 'correction';
const ADMIN = 'admin';


export function InterceptorChat() {
  const searchParams = useSearchParams();
  const username = searchParams.get('username') || 'testuser';
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [correctionText, setCorrectionText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
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
          // setMessages(prevMessages => prevMessages.slice(0, -2));
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
      role: ADMIN,
      content: inputText,
      audioUrl: '',
      message_id: `temp-${Date.now()}`,
      timestamp: new Date().toISOString()
    };

    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInputText("");

    const textareaElement = document.querySelector(
      "textarea.send-input-textarea"
    ) as HTMLTextAreaElement;
    if (textareaElement) {
      textareaElement.style.height = "auto";
    }

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


    setMessages(prevMessages => {
      let updatedMessages = prevMessages.slice(0, -1);
      const lastMessage = updatedMessages[updatedMessages.length - 1];

      setPausedMessage(false);

      const userMessage: Message = {
        role: CORRECTION,
        content: lastMessage.content + " (" + correctionText + ")",
        audioUrl: '',
        message_id: `temp-${Date.now()}`,
        timestamp: new Date().toISOString()
      };

      updatedMessages = [...updatedMessages, userMessage];

      setCorrectionText("");

      const textareaElement = document.querySelector(
        "textarea.send-correction-textarea"
      ) as HTMLTextAreaElement;
      if (textareaElement) {
        textareaElement.style.height = "auto";
      }

      return updatedMessages;
    });

    if (chatWebsocketRef.current) {
      chatWebsocketRef.current.send(JSON.stringify({
        'role': 'correction',
        'content': correctionText,
      }));
    }
  }, [correctionText, messages]);

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

  const handleTextareaInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = event.target;
    textarea.style.height = 'auto'; // Reset the height
    textarea.style.height = `${Math.min(textarea.scrollHeight, 10 * 24)}px`; // Set the height based on content, with a max of 10 rows (assuming 24px per row)
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
    </div>;
  }

  return (
    <div className="flex h-screen bg-background">
      {/* <UserSidebar username={username} /> */}
      
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
            <MessageComponents messages={messages} />
          </div>
        </ScrollArea>

        <div className="p-6 border-t border-border flex items-center bg-muted space-x-2">
          {pausedMessage ? (
            <Textarea
              className="flex-grow h-12 bg-white send-correction-textarea"
              placeholder="Update last assistant message..." 
              value={correctionText}
              onChange={(e) => {
                setCorrectionText(e.target.value);
                handleTextareaInput(e);
              }}
              onInput={handleTextareaInput}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  handleCorrectionMessage();
                }
              }}
              rows={1}
              style={{ maxHeight: '240px' }}
            />
          ) : (
            <Button 
              className="flex-grow h-12 bg-gray-500" 
              onClick={() => {
                handlePauseMessage();
              }}
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
          <Textarea
            className="flex-grow mr-2 h-12 bg-white send-input-textarea"
            placeholder="Send follow up message..." 
            value={inputText}
            onChange={(e) => {
              setInputText(e.target.value);
              handleTextareaInput(e);
            }}
            onInput={handleTextareaInput}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                handleSendMessage();
              }
            }}
            rows={1}
            style={{ maxHeight: '240px' }}
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
        <div className="fixed left-4 top-4 w-[15vw] h-[calc(15vw * 4 / 3)] max-w-[256px] max-h-[calc(256px * 4 / 3)]">
          <AdminVideo 
            username={username} 
            style={{ 
              visibility: isVideoVisible ? 'visible' : 'hidden', // Hide the video feed
              position: isVideoVisible ? 'static' : 'absolute', // Keep it in the flow or move it off-screen
            }} 
          />
          <button 
            onClick={toggleVideoFeed} 
            className="absolute left-0 top-0 bg-gray-800 text-white p-2 rounded"
          >
            {isVideoVisible ? <PanelLeftCloseIcon className="h-4 w-4" /> : <PanelRightCloseIcon className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
