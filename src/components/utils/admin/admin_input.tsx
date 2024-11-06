'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import InputBar from './inputbar'

interface AdminInputBarProps {
  onSendMessage: (message: string, images: string[]) => void;
  onSendCorrection: (correction: string, images: string[]) => void;
  pausedMessage: boolean;
  handlePauseMessage: () => void;
}


const AdminInputBar: React.FC<AdminInputBarProps> = ({ onSendMessage, onSendCorrection, pausedMessage, handlePauseMessage }) => {
  const handleTextSend = (text: string, images: string[]) => {
    onSendMessage(text, images);
  };
  
  const handleCorrectionSend = (text: string, images: string[]) => {
    onSendCorrection(text, images);
  };

  return (
    <div>
      <div className="p-6 border-t border-border flex items-center bg-muted dark:bg-muted-dark">
        {pausedMessage ? (
          <InputBar onSendMessage={handleCorrectionSend} />
        ) : (
          <Button 
            className="flex-grow h-12 bg-primary dark:bg-primary-dark" 
            onClick={() => {
              handlePauseMessage();
            }}
          >
            Update last assistant message...
          </Button>
        )}
      </div>
      
      <div className="p-6 border-t border-border flex items-center bg-muted dark:bg-muted-dark">
        <InputBar 
          onSendMessage={handleTextSend}
        />
      </div>
    </div>
  );
};


export default AdminInputBar;
