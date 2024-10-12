import { Header } from "@/components/header";
import { InterceptorChat } from "@/components/interceptor_chat";
import React from 'react';

export default function ChatPage() {
  return (
    <>
      <React.StrictMode>
        <InterceptorChat/>
      </React.StrictMode>
    </>
  );
}
