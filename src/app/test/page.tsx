'use client'

import React, { useState, useContext } from 'react';
import MessageCard, { AudioProvider, AudioContext } from '@/components/utils/audio_stream';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { WifiIcon, WifiOffIcon } from 'lucide-react';

const StatusBar: React.FC = () => {
  const context = useContext(AudioContext);
  
  if (!context) {
    throw new Error('StatusBar must be used within an AudioProvider');
  }

  const { isConnected, messageStates } = context;
  
  const activeMessages = Object.values(messageStates).filter(
    (state: any) => state.isPlaying
  );

  return (
    <Alert className="mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {isConnected ? (
            <WifiIcon className="h-4 w-4 text-green-500" />
          ) : (
            <WifiOffIcon className="h-4 w-4 text-red-500" />
          )}
          <AlertTitle>
            {isConnected ? 'Connected' : 'Disconnected'}
          </AlertTitle>
        </div>
        {activeMessages.length > 0 && (
          <AlertDescription>
            {activeMessages.length} active message{activeMessages.length !== 1 ? 's' : ''}
          </AlertDescription>
        )}
      </div>
    </Alert>
  );
};

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
        <StatusBar />
        <div className="space-y-4">
          {messages.map((message, index) => (
            <MessageCard 
              key={index}
              message={message}
            />
          ))}
        </div>
      </div>
    </AudioProvider>
  );
};

export default TestPage;