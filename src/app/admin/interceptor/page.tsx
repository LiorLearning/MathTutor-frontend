import { InterceptorChat } from "@/components/interceptor_chat";
import React, { Suspense } from 'react';

export default function InterceptorChatPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <InterceptorChat />
    </Suspense>
  );
}
