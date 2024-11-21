import React, { Suspense, lazy } from 'react';
import { FallbackComponent } from "@/components/fallback";

const Chat = lazy(() => import("@/app/chat/chat"));

export default function ChatPage() {
  return (
    <Suspense fallback={<FallbackComponent />}>
      <Chat />
    </Suspense>
  );
}
