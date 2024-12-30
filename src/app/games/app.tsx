'use client'

import React from 'react';
import { useSearchParams } from 'next/navigation'

import { AdminArtifactComponent } from '@/components/artifact/admin';
import { SessionProvider } from '@/components/session-provider';

export function App() {
  const searchParams = useSearchParams();
  const username = searchParams?.get('username') || 'testuser';
  const sessionId = searchParams?.get('session') || '0';
  
  return (
    <SessionProvider userId={username} sessionId={sessionId} route='/admin/interceptor'>
      <div className="flex h-screen bg-background text-foreground dark:bg-background dark:text-foreground">
        <AdminArtifactComponent username={username} sessionId={sessionId} />
      </div>
    </SessionProvider>
  );
}
