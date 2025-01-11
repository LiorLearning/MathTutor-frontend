'use client'

import { Button } from "@/components/ui/button"

interface SendButtonProps {
  text?: string;
  show: boolean;
  isStreaming?: boolean;
  onClick?: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
}

export function SendButton({ show, isStreaming, onClick, text = 'Send' }: SendButtonProps) {
  return (
    <Button
      className={`flex justify-center items-center px-4 py-2 rounded-md border ${isStreaming ? 'pointer-events-none opacity-50' : ''}`}
      disabled={!show}
      onClick={(event) => {
        event.preventDefault();
        onClick?.(event);
      }}
    >
      {text}
    </Button>
  );
}
