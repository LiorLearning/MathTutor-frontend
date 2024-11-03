import Chat from "@/components/chat";
import React, { Suspense } from 'react';

export default function ChatPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Chat />
    </Suspense>
  );
}
