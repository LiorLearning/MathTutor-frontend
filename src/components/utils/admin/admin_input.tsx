'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import InputBar from './input-bar'

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
    <div className="p-4 border-border bg-muted dark:bg-muted-dark">
      <div className="pb-2 border-t flex items-center">
        {pausedMessage ? (
          <>
            <InputBar onSendMessage={handleCorrectionSend} />
          </>
        ) : (
          <>
            <Button 
              className="flex-grow h-12 bg-primary dark:bg-primary-dark" 
              onClick={() => {
                handlePauseMessage();
              }}
            >
              Update last assistant message...
            </Button>
          </>
        )}
      </div>
      
      <div className="border-t border-border flex items-center bg-muted dark:bg-muted-dark">
        <InputBar 
          onSendMessage={handleTextSend}
        />
      </div>
    </div>
  );
};


export default AdminInputBar;
