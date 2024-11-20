import React, { Suspense, lazy } from 'react';
import { FallbackComponent } from "@/components/fallback";

const SessionList = lazy(() =>
  import("@/app/chat/session/session-list").then(module => ({
    default: module.SessionList
  }))
);

export default function ChatPage() {
  return (
    <Suspense fallback={<FallbackComponent />}>
      <SessionList />
    </Suspense>
  );
}
