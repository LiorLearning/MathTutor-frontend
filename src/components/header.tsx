"use client"

import { DarkModeToggle } from "./themeContext"

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full bg-primary text-primary-foreground shadow-md dark:bg-background dark:text-foreground h-16">
      <div className="container mx-auto px-6 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-wider">
            <span>MathTutor</span>
          </h1>
          <div className="flex items-center space-x-6">
            <DarkModeToggle />
          </div>
        </div>
      </div>
    </header>
  )
}