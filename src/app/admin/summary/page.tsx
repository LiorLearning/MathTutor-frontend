'use client'

import { Header } from '@/components/header';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import ChatSummary from './components/ChatSummary';
import ChatHistory from './components/ChatHistory';
import { FallbackComponent } from '@/components/fallback';
import { QueryClient, QueryClientProvider } from 'react-query';

const queryClient = new QueryClient();

function SummaryContent() {
  const searchParams = useSearchParams();
  const username = searchParams.get('username') || 'testuser';
  const sessionId = searchParams.get('session') || '0';

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <Header />
      <div className="flex flex-grow overflow-hidden">
        <div className="w-1/2 border-r border-border p-4 overflow-y-auto">
          <ChatHistory username={username} sessionId={sessionId} />
        </div>
        <div className="w-1/2 p-6 bg-muted overflow-y-auto">
          <ChatSummary username={username} sessionId={sessionId} />
        </div>
      </div>
    </div>
  );
}

export default function SummaryPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={<FallbackComponent />}>
        <SummaryContent />
      </Suspense>
    </QueryClientProvider>
  );
}
