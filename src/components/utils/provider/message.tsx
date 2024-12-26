'use client';

import { createContext, useState, useContext, ReactNode } from 'react';
import { Message } from '../user/chat_utils';

interface MessageContextType {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setIsPlaying: (messageId: string, isPlaying: boolean) => void;
}

const MessageContext = createContext<MessageContextType>({
  messages: [],
  setMessages: () => {},
  setIsPlaying: () => {},
});

export function MessageProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([]);

  const setIsPlaying = (messageId: string, isPlaying: boolean) => {
    setMessages(prevMessages => 
      prevMessages.map(msg => 
        msg.message_id === messageId ? { ...msg, isPlaying } : msg
      )
    );
  }

  return (
    <MessageContext.Provider value={{ messages, setMessages, setIsPlaying }}>
      {children}
    </MessageContext.Provider>
  );
}

export function useMessageContext() {
  const context = useContext(MessageContext);
  if (context === undefined) {
    throw new Error('useMessageContext must be used within a MessageProvider');
  }
  return context;
}
