"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DarkModeToggle } from "./themeContext"

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full bg-primary text-primary-foreground shadow-md dark:bg-background dark:text-foreground">
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-wider">
            <span>MathTutor</span>
          </h1>
          <div className="flex items-center space-x-4">
            <DarkModeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-12 w-12 rounded-full p-0">
                  <Avatar className="h-12 w-12 border-2 border-primary-foreground dark:border-foreground">
                    {/* <AvatarImage src="/images/placeholder-avatar.jpg" alt="Kid's profile" /> */}
                    <AvatarFallback className="text-xl font-bold text-primary bg-primary-foreground dark:text-foreground dark:bg-background">KB</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-primary-foreground text-primary dark:bg-background dark:text-foreground rounded-xl shadow-lg" align="end">
                <div className="flex items-center p-4 space-x-4">
                  <Avatar className="h-10 w-10">
                    {/* <AvatarImage src="/images/placeholder-avatar.jpg" alt="Kid's profile" /> */}
                    <AvatarFallback className="text-lg font-bold text-primary bg-yellow-300 dark:text-foreground dark:bg-background">KB</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Math Explorer</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Level 5</p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-sm py-2 cursor-pointer hover:bg-primary-100 dark:hover:bg-muted">
                  My Achievements
                </DropdownMenuItem>
                <DropdownMenuItem className="text-sm py-2 cursor-pointer hover:bg-primary-100 dark:hover:bg-muted">
                  Change Avatar
                </DropdownMenuItem>
                <DropdownMenuItem className="text-sm py-2 cursor-pointer hover:bg-primary-100 dark:hover:bg-muted">
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-sm py-2 cursor-pointer hover:bg-red-100 text-red-600 dark:hover:bg-destructive dark:text-destructive-foreground">
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}