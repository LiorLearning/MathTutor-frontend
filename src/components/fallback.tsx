import { Loader2 } from "lucide-react";
import React from "react";

export function FallbackComponent() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
      <div className="text-center space-y-4">
        <Loader2 className="w-16 h-16 animate-spin mx-auto text-primary" />
        <h1 className="text-2xl font-bold">It is taking longer than expected</h1>
        <p className="text-lg">
          Can you please clear your existing tabs and try reloading the page?
        </p>
        <p className="text-lg">
          If the issue persists, please update your browser.
        </p>
      </div>
    </div>
  );
}