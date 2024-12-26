import React, { useEffect } from 'react';
import { Square } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import Header from './header';
import MessageComponents from '../messages';
import ImageLoader from '@/components/ui/loaders/image_loader';
import MessageLoader from '@/components/ui/loaders/message_loader';
import InputBar from '../input_bar';
import SpeechToText from '../audio/speech_to_text';
import { Message } from '../chat_utils';
import { useMessageContext } from '../../provider/message';

interface MobileProps {
  username: string;
  isChatConnected: boolean;
  speakout: boolean;
  toggleSpeakout: () => void;
  scrollAreaRef: React.RefObject<HTMLDivElement>;
  toggleAudio: (message: Message) => Promise<void>;
  isGeneratingImage: boolean;
  isSendingMessage: boolean;
  isLastMessagePauseRef: React.MutableRefObject<boolean>;
  sendStopMessage: () => void;
  onSendTextMessage: (message: string) => void;
  handleRecordingStart: () => void;
  handleRecordingStop: (blob: Blob) => void;
  isRightColumnCollapsedRef: React.MutableRefObject<boolean>;
  sessionId: string;
  deviceType: string;
  isRightColumnCollapsed: boolean;
  setIsRightColumnCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
}

const MobileChat: React.FC<MobileProps> = ({
  username,
  isChatConnected,
  speakout,
  toggleSpeakout,
  scrollAreaRef,
  toggleAudio,
  isGeneratingImage,
  isSendingMessage,
  isLastMessagePauseRef,
  sendStopMessage,
  onSendTextMessage,
  handleRecordingStart,
  handleRecordingStop,
  isRightColumnCollapsedRef,
  sessionId,
  deviceType,
  isRightColumnCollapsed,
  setIsRightColumnCollapsed
}) => {

  // const [compactHeader, setCompactHeader] = useState(false); 
  const { messages } = useMessageContext();

  // Sync state with ref
  useEffect(() => {
    isRightColumnCollapsedRef.current = isRightColumnCollapsed;
    setIsRightColumnCollapsed(isRightColumnCollapsed);
    // setCompactHeader(!isRightColumnCollapsed);
  }, [isRightColumnCollapsed]);

  return (
    <React.Fragment>
      <div className="h-full flex flex-col border-border dark:border-dark-border">
        <Header 
          username={username} 
          sessionId={sessionId}
          isChatConnected={isChatConnected}
          speakout={speakout}
          toggleSpeakout={toggleSpeakout}
          deviceType={deviceType}
          compact={true}
        />

        <ScrollArea ref={scrollAreaRef} className="flex-grow overflow-y-auto overflow-hidden px-4 mb-16">
          <MessageComponents 
            messages={messages}
            toggleAudio={toggleAudio}
          />
        </ScrollArea>
        
        <div className="fixed bottom-0 left-0 right-0 z-12">
          {isGeneratingImage || isSendingMessage || isLastMessagePauseRef.current ? (
            <div className="relative flex items-center justify-center pb-2">
              <div className="flex items-center justify-center gap-4">
                {isGeneratingImage ? <ImageLoader /> : <MessageLoader />}
                {(isGeneratingImage || isSendingMessage) && (
                  <Button size="sm" onClick={sendStopMessage} className="ml-4">
                    <Square className="mr-2 text-sm" />
                    Stop
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="py-2 border-t border-border dark:border-dark-border flex items-center justify-center">
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
      </div>

      {/* <UserArtifactComponent 
        username={username} 
        isRightColumnCollapsed={isRightColumnCollapsedRef}
        toggleRightColumn={toggleRightColumn} 
        sessionId={sessionId}
      /> */}

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

      {/* <Button
        className="fixed bottom-4 right-4 z-10"
        onClick={() => setIsRightColumnCollapsed(!isRightColumnCollapsed)}
        aria-label={isRightColumnCollapsed ? "Expand right column" : "Collapse right column"}
      >
        {isRightColumnCollapsed ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </Button> */}
    </React.Fragment>
  );
};

export default MobileChat;