'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import InputBar from './input-bar'

interface AdminInputBarProps {
  onSendMessage: (message: string, images: string[]) => void;
  onSendCorrection: (correction: string, images: string[]) => void;
  pausedMessage: boolean;
  handlePauseMessage: () => void;
  onEndSession: () => void;
}


const AdminInputBar: React.FC<AdminInputBarProps> = ({ onSendMessage, onSendCorrection, pausedMessage, handlePauseMessage, onEndSession }) => {
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
        <Button 
          className="ml-2 h-10 px-4 py-2 rounded-md hover:bg-red-700 transition-colors duration-300"
          onClick={onEndSession}
        >
          End Session
        </Button>
      </div>
    </div>
  );
};


export default AdminInputBar;
