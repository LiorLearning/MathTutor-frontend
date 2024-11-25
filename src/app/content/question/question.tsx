'use client'

import React, { useEffect } from 'react'
import { Question } from '@/types/question-bank'
import { fetchQuestionById } from '../actions/fetchQuestion';
import { MarkdownComponent } from './markdown';

export function QuestionDisplay({ questionId }: { questionId: string }) {
  const [question, setQuestion] = React.useState<Question | null>(null);

  useEffect(() => {
    const fetchQuestion = async () => {
      const fetchedQuestion = await fetchQuestionById(questionId);
      setQuestion(fetchedQuestion);
    };

    fetchQuestion();
  }, [questionId]);

  return (
    <div className="container mx-auto p-4">
      <div className="bg-card shadow-md rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-4 text-foreground">Question</h1>
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Question Text:</h3>
            <div className="mt-2 p-4 bg-muted rounded-md">
              <MarkdownComponent content={question?.question_text || ''} />
            </div>
          </div>
          {question?.question_desc && (
            <div>
              <h3 className="text-lg font-semibold text-foreground">Description:</h3>
              <p className="mt-2 text-muted-foreground">{question.question_desc}</p>
            </div>
          )}
          <div>
            <h3 className="text-lg font-semibold text-foreground">Content ID:</h3>
            <p className="mt-2 text-muted-foreground">{question?.content_id}</p>
          </div>
        </div>
      </div>
    </div>
  )
}