'use client'

import React from 'react';

const PageLoader: React.FC = () => {
  return (
    <div className="flex items-center justify-center h-screen bg-background text-foreground">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-foreground"></div>
    </div>
  );
};

export default PageLoader;
