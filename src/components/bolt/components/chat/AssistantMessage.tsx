'use client'

import { memo } from 'react';
import { Markdown } from './Markdown';

interface AssistantMessageProps {
  content: string;
}

const AssistantMessageComponent = ({ content }: AssistantMessageProps) => {
  return (
    <div className="overflow-hidden w-full">
      <Markdown html>{content}</Markdown>
    </div>
  );
};

AssistantMessageComponent.displayName = 'AssistantMessage';

export const AssistantMessage = memo(AssistantMessageComponent);
