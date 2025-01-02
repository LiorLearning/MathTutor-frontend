'use client'

import { useEffect, useCallback } from 'react'
import axios from 'axios'
import { GetChatHistoryResponse, API_BASE_URL } from '@/components/utils/user/chat_utils'
import MessageComponents from '@/components/utils/admin/messages'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useMessageContext } from '@/components/utils/provider/message'
interface ChatHistoryProps {
  username: string;
  sessionId: string;
}

export default function ChatHistory({ username, sessionId }: ChatHistoryProps) {
  const { setMessages } = useMessageContext();

  const fetchChatHistory = useCallback(async () => {
    try {
      const response = await axios.get<GetChatHistoryResponse>(
        `${API_BASE_URL}/chat_history?user_id=${username}&session_id=${sessionId}`,
        { headers: { 'Content-Type': 'application/json' } }
      )
      setMessages(response.data || []);
    } catch (error) {
      console.error('Error fetching chat history:', error)
    }
  }, [username, sessionId])

  useEffect(() => {
    fetchChatHistory()
  }, [fetchChatHistory])

  return (
    <div className="p-4 space-y-4">
      <ScrollArea className="flex-grow p-4">
        <div className="space-y-6">
          <MessageComponents />
        </div>
      </ScrollArea>
    </div>
  )
}
