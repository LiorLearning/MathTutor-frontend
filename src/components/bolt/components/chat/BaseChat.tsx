'use client'

import React, { type RefCallback, useEffect } from 'react'
import { type Message } from 'ai'
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Workbench } from '@/components/bolt/components/workbench/Workbench.client'
import { SendButton } from './SendButton.client'
import { Stars, Loader2 } from 'lucide-react'

interface BaseChatProps {
  textareaRef?: React.RefObject<HTMLTextAreaElement>
  messageRef?: RefCallback<HTMLDivElement>
  scrollRef?: RefCallback<HTMLDivElement>
  showChat?: boolean
  chatStarted?: boolean
  isStreaming?: boolean
  messages?: Message[]
  enhancingPrompt?: boolean
  promptEnhanced?: boolean
  input?: string
  handleStop?: () => void
  sendMessage?: (event: React.UIEvent, messageInput?: string) => void
  handleInputChange?: (event: React.ChangeEvent<HTMLTextAreaElement>) => void
  enhancePrompt?: () => void
}

export const BaseChat = React.forwardRef<HTMLDivElement, BaseChatProps>(
  ({
    textareaRef,
    messageRef,
    scrollRef,
    showChat = true,
    chatStarted = false,
    isStreaming = false,
    enhancingPrompt = false,
    promptEnhanced = false,
    messages,
    input = '',
    sendMessage,
    handleInputChange,
    enhancePrompt,
    handleStop,
  }, ref) => {
    const TEXTAREA_MIN_HEIGHT = 76
    const TEXTAREA_MAX_HEIGHT = chatStarted ? 400 : 200

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
                sendMessage?.(event)
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
            <Button
              variant="outline"
              size="sm"
              className={`flex items-center ${promptEnhanced ? 'text-primary' : ''}`}
              disabled={input.length === 0 || enhancingPrompt}
              onClick={() => enhancePrompt?.()}
            >
              {enhancingPrompt ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Enhancing prompt...</span>
                </>
              ) : (
                <>
                  <Stars className="h-4 w-4" />
                  <span>{promptEnhanced ? 'Prompt enhanced' : 'Enhance prompt'}</span>
                </>
              )}
            </Button>
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
    )
  }
)

BaseChat.displayName = 'BaseChat'
