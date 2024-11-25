'use client'

import { Header } from '@/components/header';
import { QuestionDisplay } from './question';
import { useSearchParams } from 'next/navigation';

export default function QuestionPage() {
  const searchParams = useSearchParams();
  const questionId = searchParams.get('id');
  
  if (!questionId) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold mb-6">Question Details</h1>
        <p>No question ID provided in the URL.</p>
      </div>
    );
  }

  return (
    <>
      <Header />
      <QuestionDisplay questionId={questionId} />
    </>
  );
}