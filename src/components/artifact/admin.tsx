'use client'

import { Chat } from '@/components/bolt/components/chat/ChatClient';
import { AdminWebSocketProvider } from '@/components/bolt/components/websocket/admin';

export interface AdminArtifactProps {
    username: string;
    sessionId: string;
  }
  
  export const AdminArtifactComponent: React.FC<AdminArtifactProps> = ({ username, sessionId }) => {
  return (
    <div className="flex flex-col h-full w-full">
      <AdminWebSocketProvider base_url={`${process.env.NEXT_PUBLIC_WS_BASE_URL}/bolt/ws/${username}/${sessionId}`}>
        <Chat />
      </AdminWebSocketProvider>
    </div>
  );
}
