import React, { useMemo } from 'react';
import { Message, MarkdownComponent } from '../chat/chat_utils';

const USER = 'user';
const ASSISTANT = 'assistant';
const CORRECTION = 'correction';
const ADMIN = 'admin';

interface MessageComponentsProps {
  messages: Message[];
}

const MessageComponents: React.FC<MessageComponentsProps> = ({ messages }) => {
  const messageComponents = useMemo(() => (
    Array.isArray(messages) ? messages.map((message, index) => (
      <div 
        key={message.message_id} 
        className="flex flex-col items-center justify-center h-full"
      >
        <div className={`max-w-[90%] ${message.role === ASSISTANT ? 'self-start' : 'self-end'}`}>
          <div
            className={`rounded-3xl p-4 ${
              message.role === USER
                ? 'bg-primary text-white'
                : message.role === CORRECTION
                ? 'bg-yellow-200 text-gray-800'
                : message.role === ADMIN
                ? 'bg-green-200 text-gray-800'
                : 'bg-gray-200 text-gray-800'
            } ${(message.role === ADMIN || message.role === CORRECTION) && index < messages.length - 1 ? 'opacity-50' : ''} 
            ${message.role !== USER && index === messages.length - 1 ? 'opacity-100' : ''}`}
          >
            <MarkdownComponent content={message.content} />
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {new Date(message.timestamp).toLocaleTimeString()}
          </div>
        </div>
      </div>
    )) : null
  ), [messages]);

  return <>{messageComponents}</>;
};

export default MessageComponents;