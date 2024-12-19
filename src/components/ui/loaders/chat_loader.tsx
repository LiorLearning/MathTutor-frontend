import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

export const ChatLoader: React.FC = () => {
  const [showReloadMessage, setShowReloadMessage] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowReloadMessage(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground dark:bg-background dark:text-foreground">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary dark:border-primary mb-4"></div>
      
      {showReloadMessage && (
        <div className="text-center">
          <p className="mb-4 text-muted-foreground">
            Loading is taking longer than expected.
          </p>
          <Button onClick={handleReload}>
            Reload Page
          </Button>
        </div>
      )}
    </div>
  );
};
