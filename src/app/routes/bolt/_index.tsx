import { json, type MetaFunction } from '@remix-run/cloudflare';
import { ClientOnly } from 'remix-utils/client-only';
import { BaseChat } from '@/components/bolt/components/chat/BaseChat';
import { Chat } from '@/components/bolt/components/chat/Chat.client';
import { Header } from '@/components/bolt/components/header/Header';

export const meta: MetaFunction = () => {
  return [{ title: 'Lior' }, { name: 'description', content: 'Talk with Lior, an AI assistant from Lior AI' }];
};

export const loader = () => json({});

export default function Index() {
  return (
    <div className="flex flex-col h-full w-full">
      <Header />
      <ClientOnly fallback={<BaseChat />}>{() => <Chat />}</ClientOnly>
    </div>
  );
}