'use client'

import React, { type RefCallback, useEffect, useState } from 'react'
import { type Message } from 'ai'
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Workbench } from '@/components/bolt/components/workbench/Workbench.client'
import { SendButton } from './SendButton.client'
import { Switch } from "@/components/ui/switch"

interface BaseChatProps {
  textareaRef?: React.RefObject<HTMLTextAreaElement>
  messageRef?: RefCallback<HTMLDivElement>
  scrollRef?: RefCallback<HTMLDivElement>
  showChat?: boolean
  chatStarted?: boolean
  isStreaming?: boolean
  messages?: Message[]
  input?: string
  handleStop?: () => void
  contexualiseGameFiles?: () => void
  sendMessage?: (event: React.UIEvent, messageInput?: string, stateFile?: boolean) => void
  handleInputChange?: (event: React.ChangeEvent<HTMLTextAreaElement>) => void
}

export const BaseChat = React.forwardRef<HTMLDivElement, BaseChatProps>(
  ({
    textareaRef,
    messageRef,
    scrollRef,
    showChat = true,
    chatStarted = false,
    isStreaming = false,
    messages,
    input = '',
    sendMessage,
    handleInputChange,
    handleStop,
    contexualiseGameFiles,
  }, ref) => {
    const TEXTAREA_MIN_HEIGHT = 76
    const TEXTAREA_MAX_HEIGHT = chatStarted ? 400 : 200
    const [stateFile, setStateFile] = useState(false); // Toggle for stateFile

    useEffect(() => {
    }, [messages, messageRef]);

    useEffect(() => {
    }, [scrollRef]);

    return (
      <div
        ref={ref}
        className="relative flex flex-col h-full w-full overflow-hidden bg-background"
        data-chat-visible={showChat}
      >
        <div className="h-full overflow-hidden">
          <Workbench chatStarted={true} isStreaming={isStreaming} />
        </div>
        
        <div className="p-1 pt-2 flex flex-col">
          <Textarea
            ref={textareaRef}
            className="w-full resize-none text-md focus-visible:ring-1"
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                sendMessage?.(
                  event,
                  undefined,
                  stateFile, // Pass the stateFile toggle
                )
              }
            }}
            value={input}
            onChange={handleInputChange}
            style={{
              minHeight: TEXTAREA_MIN_HEIGHT,
              maxHeight: TEXTAREA_MAX_HEIGHT,
            }}
            placeholder="What can I create for you?"
            translate="no"
          />
          <div className="flex justify-between items-center pt-2">
            <Button onClick={contexualiseGameFiles}>Contexualise</Button>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">
                  {stateFile ? 'State changes' : 'Game changes'}
                </span>
                <Switch
                  checked={stateFile}
                  onCheckedChange={setStateFile}
                  aria-label="State changes toggle"
                />
              </div>
              <SendButton
                show={input.length > 0}
                isStreaming={isStreaming}
                onClick={(event) => {
                  if (isStreaming) {
                    handleStop?.()
                    return
                  }
                  sendMessage?.(event)
                }}
              />
            </div>
          </div>
        </div>
      </div>
    )
  }
)

BaseChat.displayName = 'BaseChat'
