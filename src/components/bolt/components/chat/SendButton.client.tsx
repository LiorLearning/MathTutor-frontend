'use client'

import { Button } from "@/components/ui/button"

interface SendButtonProps {
  show: boolean;
  isStreaming?: boolean;
  onClick?: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
}

export function SendButton({ show, onClick }: SendButtonProps) {
  return (
    <Button
      className={`flex justify-center items-center px-4 py-2 rounded-md border`}
      disabled={!show}
      onClick={(event) => {
        event.preventDefault();
        onClick?.(event);
      }}
    >
      Send
    </Button>
  );
}
