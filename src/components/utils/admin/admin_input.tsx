'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import InputBar from './inputbar'

interface AdminInputBarProps {
  onSendMessage: (message: string) => void;
  onSendCorrection: (correction: string) => void;
  pausedMessage: boolean;
  handlePauseMessage: () => void;
}


const AdminInputBar: React.FC<AdminInputBarProps> = ({ onSendMessage, onSendCorrection, pausedMessage, handlePauseMessage }) => {
  const handleTextSend = (text: string, images: File[]) => {
    onSendMessage(text);
  };
  
  const handleCorrectionSend = (text: string, images: File[]) => {
    onSendCorrection(text);
  };

  return (
    <div>
      <div className="p-6 border-t border-border flex items-center bg-muted">
        {pausedMessage ? (
          <InputBar onSendMessage={handleCorrectionSend} />
        ) : (
          <Button 
            className="flex-grow h-12 bg-gray-500" 
            onClick={() => {
              handlePauseMessage();
            }}
          >
            Update last assistant message...
          </Button>
        )}
      </div>
      
      <div className="p-6 border-t border-border flex items-center bg-gray-400">
        <InputBar 
          onSendMessage={handleTextSend}
        />
      </div>
    </div>
  );
};


export default AdminInputBar;
