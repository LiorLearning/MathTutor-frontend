import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Square } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import Header from '../header';
import MessageComponents from '../messages';
import ImageLoader from '@/components/ui/loaders/image_loader';
import MessageLoader from '@/components/ui/loaders/message_loader';
import InputBar from '../input_bar';
import SpeechToText from '../audio/speech_to_text';
import { UserArtifactComponent } from '@/components/artifact/user';
import { Message } from '../chat_utils';

interface DesktopProps {
  username: string;
  isChatConnected: boolean;
  speakout: boolean;
  toggleSpeakout: () => void;
  scrollAreaRef: React.RefObject<HTMLDivElement>;
  messages: Message[];
  toggleAudio: (message: Message) => Promise<void>;
  isGeneratingImage: boolean;
  isSendingMessage: boolean;
  isLastMessagePauseRef: React.MutableRefObject<boolean>;
  sendStopMessage: () => void;
  onSendTextMessage: (message: string) => void;
  handleRecordingStart: () => void;
  handleRecordingStop: (blob: Blob) => void;
  isRightColumnCollapsedRef: React.MutableRefObject<boolean>;
  toggleRightColumn: () => void;
  sessionId: string;
}

const DesktopChat: React.FC<DesktopProps> = ({
  username,
  isChatConnected,
  speakout,
  toggleSpeakout,
  scrollAreaRef,
  messages,
  toggleAudio,
  isGeneratingImage,
  isSendingMessage,
  isLastMessagePauseRef,
  sendStopMessage,
  onSendTextMessage,
  handleRecordingStart,
  handleRecordingStop,
  isRightColumnCollapsedRef,
  toggleRightColumn,
  sessionId
}) => {
  return (
    <React.Fragment>
      <motion.div
        className="flex-1 p-6 transition-all duration-200 ease-in-out"
        animate={{
          width: isRightColumnCollapsedRef.current ? "100%" : "50%",
        }}
        style={{
          marginRight: isRightColumnCollapsedRef.current ? "0%" : "50%",
        }}
      >
        <div className="h-full flex flex-col border-border dark:border-dark-border">
          <Header 
            username={username} 
            isChatConnected={isChatConnected}
            speakout={speakout}
            toggleSpeakout={toggleSpeakout}
          />

          <ScrollArea ref={scrollAreaRef} className="flex-grow p-4 overflow-y-auto">
            <div className="space-y-6">
              <MessageComponents 
                messages={messages}
                toggleAudio={toggleAudio}
              />
            </div>
          </ScrollArea>
          
          {isGeneratingImage || isSendingMessage || isLastMessagePauseRef.current ? (
            <div className="relative flex items-center justify-center">
              <div className="flex items-center justify-center">
                {isGeneratingImage ? <ImageLoader /> : <MessageLoader />}
              </div>
              {(isGeneratingImage || isSendingMessage) && (
                <Button size="sm" onClick={sendStopMessage} className="ml-4">
                  <Square className="mr-2 text-sm" />
                  Stop
                </Button>
              )}
            </div>
          ) : (
            <div className="pt-4 border-t border-border dark:border-dark-border flex items-center justify-center">
              <div className="relative flex flex-row items-center gap-4 max-w-xs mx-auto">
                <div className='relative'>
                  <InputBar onSendMessage={onSendTextMessage} />
                </div>
                <div className='relative w-1/2'>
                  <SpeechToText onRecordingStart={handleRecordingStart} onRecordingStop={handleRecordingStop} />
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      <motion.div
        className="fixed right-0 top-0 h-full w-[50%] bg-secondary dark:bg-dark-secondary p-6 shadow-lg transition-all duration-200 ease-in-out"
        animate={{
          x: isRightColumnCollapsedRef.current ? "100%" : "0%",
        }}
      >
        <UserArtifactComponent 
          username={username} 
          isRightColumnCollapsed={isRightColumnCollapsedRef}
          toggleRightColumn={toggleRightColumn} 
          sessionId={sessionId}
        />
      </motion.div>

      {/* <div className="fixed right-8 top-20 w-[15vw] h-[calc(15vw * 4 / 3)] max-w-[256px] max-h-[calc(256px * 4 / 3)]">
            <UserVideo 
              username={username}
              style={{ 
                visibility: isVideoVisible ? 'visible' : 'hidden',
                position: isVideoVisible ? 'static' : 'absolute',
              }}
            />
            <Button 
              onClick={toggleVideoFeed} 
              className="absolute top-0 right-0 bg-gray-800 dark:bg-dark-gray-800 text-white p-2 rounded"
            >
              {isVideoVisible ? <PanelRightClose className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </Button>
          </div> */}

      <Button
        className="fixed bottom-4 right-4 z-10"
        onClick={toggleRightColumn}
        aria-label={isRightColumnCollapsedRef.current ? "Expand right column" : "Collapse right column"}
      >
        {isRightColumnCollapsedRef.current ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </Button>
    </React.Fragment>
  );
};

export default DesktopChat;