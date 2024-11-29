import React from 'react';
import { DarkModeToggle } from './themeContext';

export function Header() {
  return (
    <header className="mt-6 mx-4 pb-2 px-4 border-b border-border bg-background text-foreground">
      <div className="flex justify-between items-center">
        <h1 className="text-lg font-bold">MathTutor</h1>
        <DarkModeToggle />
      </div>
    </header>
  );
};