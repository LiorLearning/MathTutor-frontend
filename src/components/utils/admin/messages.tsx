'use client';

import React, { useMemo } from 'react';
import { MarkdownComponent } from '../user/chat_utils';
import { useMessageContext } from '../provider/message';

const USER = 'user';
const ASSISTANT = 'assistant';
const ASSISTANT_HIDE = 'assistant_hide';
const CORRECTION = 'correction';
const CORRECTED = 'corrected';
const ADMIN = 'admin';


const MessageComponents: React.FC= () => {
  const { messages } = useMessageContext();

  const messageComponents = useMemo(() => (
    Array.isArray(messages) ? messages
      .filter(message => message.role !== ASSISTANT_HIDE)
      .map((message) => (
        <div 
          key={message.message_id} 
          className={`flex flex-col items-center justify-center h-full`}
        >
          <div className={`max-w-[90%] ${message.role === ASSISTANT || message.role === CORRECTED ? 'self-start' : 'self-end'}`}>
            <div
              className={`rounded-3xl p-4 ${
                message.role === USER
                  ? 'bg-primary text-primary-foreground'
                  : message.role === CORRECTION
                  ? 'bg-yellow-200 text-gray-800 dark:bg-yellow-700 dark:text-gray-200'
                  : message.role === ADMIN
                  ? 'bg-green-200 text-gray-800 dark:bg-green-700 dark:text-gray-200'
                  : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
              } ${message.role === CORRECTED ? 'opacity-50 line-through' : ''}`}
            >
              <MarkdownComponent content={message.content} />
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {new Date(message.timestamp).toLocaleTimeString()}
            </div>
          </div>
        </div>
      )) : null
  ), [messages]);

  return <>{messageComponents}</>;
};

export default MessageComponents;