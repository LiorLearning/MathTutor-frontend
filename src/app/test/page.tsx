'use client'

import React, { useState } from 'react';
import { AudioProvider } from '@/components/utils/audio_stream';
import MessageCard from '@/components/utils/audio_stream';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const TestPage: React.FC = () => {
  const [text, setText] = useState('');
  const [messages, setMessages] = useState<string[]>([
    "Welcome to the chat!",
    "Feel free to send a message.",
    "This is a test message."
  ]);

  return (
    <AudioProvider>
      <div className="container mx-auto p-4">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <MessageCard 
              key={index}
              message={message}
              index={index}
            />
          ))}
        </div>
      </div>
    </AudioProvider>
  );
};

export default TestPage;
