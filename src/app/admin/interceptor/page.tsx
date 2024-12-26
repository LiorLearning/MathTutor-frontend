import { InterceptorChat } from "@/app/admin/interceptor/interceptor_chat";
import { FallbackComponent } from "@/components/fallback";
import { MessageProvider } from "@/components/utils/provider/message";
import React, { Suspense } from 'react';

export default function InterceptorChatPage() {
  return (
    <Suspense fallback={<FallbackComponent />}>
      <MessageProvider>
        <InterceptorChat />
      </MessageProvider>
    </Suspense>
  );
}
