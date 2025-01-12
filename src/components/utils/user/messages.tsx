'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Pause, Volume2, ChevronUp } from 'lucide-react'
import { Message, MarkdownComponent } from './chat_utils'

const USER = 'user'
const ASSISTANT = 'assistant'
const RETHINKING_MESSAGE = 'rethinking'
const MESSAGES_PER_PAGE = 10

interface MessageComponentsProps {
  messages: Message[]
  toggleAudio: (message: Message) => void
}

export default function MessageComponents({ messages, toggleAudio }: MessageComponentsProps) {
  const [visibleCount, setVisibleCount] = useState(MESSAGES_PER_PAGE)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleLoadMore: () => void = () => {
    setVisibleCount((prevCount) => Math.min(prevCount + MESSAGES_PER_PAGE, messages.length))
  }

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const visibleMessages = messages.slice(-visibleCount)

  return (
    <div className="flex flex-col overflow-hidden relative">
      <div className="overflow-y-auto flex-grow">
        {visibleMessages.map((message) => (
          <MessageItem 
            key={message.message_id} 
            message={message} 
            toggleAudio={toggleAudio}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>
      {visibleCount < messages.length && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 opacity-100 rounded-lg shadow-lg bg-secondary text-secondary-foreground">
          <Button onClick={handleLoadMore} variant="outline" size="sm" className="flex items-center space-x-2">
            <ChevronUp className="h-4 w-4 text-secondary-foreground" />
            <span>Load More</span>
          </Button>
        </div>
      )}
    </div>
  )
}

interface MessageItemProps {
  message: Message;
  toggleAudio: (message: Message) => void;
}

function MessageItem({ message, toggleAudio }: MessageItemProps) {
  return (
    <div className={`flex flex-col items-center justify-center mb-4`}>
      <div className={`max-w-[90%] ${message.role === USER ? 'self-end' : 'self-start'}`}>
        <div
          className={`rounded-3xl p-4 ${
            message.role === USER ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
          }`}
        >
          {message.content === RETHINKING_MESSAGE ? (
            <RethinkingAnimation />
          ) : (
            <MarkdownComponent content={message.content} />
          )}

          {message.role === ASSISTANT && (
            <div className="mt-2 flex justify-end">
            <Button 
              size="sm"
              variant="outline"
              className="rounded-xl px-2 py-1"
              onClick={() => toggleAudio(message)}
            >
              {message.isPlaying ? <Pause className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
          </div>
          )}
        </div>
        {/* <div className="text-xs text-muted-foreground mt-1">{new Date(message.timestamp).toLocaleTimeString()}</div> */}
      </div>
    </div>
  )
}

function RethinkingAnimation() {
  return (
    <div className="flex items-center justify-center bg-secondary rounded-lg px-8 py-4">
      <motion.div
        className="flex flex-col items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-lg font-medium text-secondary-foreground">
          <motion.span
            initial={{ opacity: 0.5 }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            Rethinking...
          </motion.span>
        </div>

        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-primary rounded-full"
              initial={{ opacity: 0.5 }}
              animate={{
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  )
}