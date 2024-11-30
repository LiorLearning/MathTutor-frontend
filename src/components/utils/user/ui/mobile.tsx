'use client'

import React, { useRef } from 'react'
import { Square } from 'lucide-react'
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import Header from '../header'
import MessageComponents from '../messages'
import ImageLoader from '@/components/ui/loaders/image_loader'
import MessageLoader from '@/components/ui/loaders/message_loader'
import InputBar from '../input_bar'
import SpeechToText from '../audio/speech_to_text'
import { Message } from '../chat_utils'

interface MobileChatProps {
  username: string
  isChatConnected: boolean
  speakout: boolean
  toggleSpeakout: () => void
  messages: Message[]
  toggleAudio: (message: Message) => Promise<void>
  isGeneratingImage: boolean
  isSendingMessage: boolean
  isLastMessagePauseRef: React.MutableRefObject<boolean>
  sendStopMessage: () => void
  onSendTextMessage: (message: string) => void
  handleRecordingStart: () => void
  handleRecordingStop: (blob: Blob) => void
  sessionId: string
}

const MobileChat: React.FC<MobileChatProps> = ({
  username,
  isChatConnected,
  speakout,
  toggleSpeakout,
  messages,
  toggleAudio,
  isGeneratingImage,
  isSendingMessage,
  isLastMessagePauseRef,
  sendStopMessage,
  onSendTextMessage,
  handleRecordingStart,
  handleRecordingStop,
  sessionId
}) => {
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  return (
    <div className="flex flex-col h-screen bg-background dark:bg-dark-background">
      <Header 
        username={username} 
        isChatConnected={isChatConnected}
        speakout={speakout}
        toggleSpeakout={toggleSpeakout}
      />

      <ScrollArea ref={scrollAreaRef} className="flex-grow px-4 py-2 overflow-y-auto">
        <div className="space-y-4">
          <MessageComponents 
            messages={messages}
            toggleAudio={toggleAudio}
          />
        </div>
      </ScrollArea>
      
      <div className="border-t border-border dark:border-dark-border bg-background dark:bg-dark-background">
        {isGeneratingImage || isSendingMessage || isLastMessagePauseRef.current ? (
          <div className="flex items-center justify-center p-4">
            <div className="flex items-center justify-center">
              {isGeneratingImage ? <ImageLoader /> : <MessageLoader />}
            </div>
            {(isGeneratingImage || isSendingMessage) && (
              <Button size="sm" onClick={sendStopMessage} className="ml-4">
                <Square className="mr-2 h-4 w-4" />
                Stop
              </Button>
            )}
          </div>
        ) : (
          <div className="p-4 flex flex-col items-center space-y-2">
            <div className="w-full">
              <InputBar onSendMessage={onSendTextMessage} />
            </div>
            <div className="w-full">
              <SpeechToText onRecordingStart={handleRecordingStart} onRecordingStop={handleRecordingStop} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MobileChat

