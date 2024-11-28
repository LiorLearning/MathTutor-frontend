'use client'

import React from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { FallbackComponent } from "@/components/fallback";
import { Header } from "@/components/header";
import SessionList from "@/components/session-list";

const queryClient = new QueryClient();

export default function ChatPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <React.Suspense fallback={<FallbackComponent />}>
        <Header />
        <SessionList is_admin={true} />
      </React.Suspense>
    </QueryClientProvider>
  );
}