'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import axios from 'axios'
import { Message, GetChatHistoryResponse, API_BASE_URL } from '@/components/utils/chat/chat_utils'
import MessageComponents from '@/components/utils/admin/messages'
import { ScrollArea } from '@/components/ui/scroll-area'

interface ChatHistoryProps {
  username: string;
  sessionId: string;
}

export default function ChatHistory({ username, sessionId }: ChatHistoryProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages]);

  const fetchChatHistory = useCallback(async () => {
    try {
      const response = await axios.get<GetChatHistoryResponse>(
        `${API_BASE_URL}/chat_history?user_id=${username}&session_id=${sessionId}`,
        { headers: { 'Content-Type': 'application/json' } }
      )
      setMessages(response.data || [])
    } catch (error) {
      console.error('Error fetching chat history:', error)
    }
  }, [username, sessionId])

  useEffect(() => {
    fetchChatHistory()
  }, [fetchChatHistory])

  return (
    <div className="p-4 space-y-4">
      <ScrollArea className="flex-grow p-4" ref={scrollAreaRef}>
        <div className="space-y-6">
          <MessageComponents messages={messages} />
        </div>
      </ScrollArea>
    </div>
  )
}
