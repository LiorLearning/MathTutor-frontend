import React from 'react';
import { User, Wifi, WifiOff, Trash, Settings, LogOut, PowerOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DarkModeToggle } from '@/components/themeContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"


interface AdminHeaderProps {
  username: string;
  sessionId: string;
  isChatConnected: boolean;
  handleDeleteChat: () => void;
  onEndSession: () => void;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({ username, sessionId, isChatConnected, handleDeleteChat, onEndSession }) => {
  return (
    <header className="p-4 border-b border-border dark:border-border bg-background text-foreground dark:bg-background dark:text-foreground sticky top-0 z-10">
      <div className="flex justify-between items-center">
        <h1 className="text-lg font-bold text-primary-foreground dark:text-primary-foreground">MathTutor</h1>
        <div className="flex items-center gap-4">
          {isChatConnected ? (
            <Wifi className="text-green-500" size={16} />
          ) : (
            <WifiOff className="text-red-500" size={16} />
          )}
          <DarkModeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2">
                <User size={16} />
                <span className="hidden sm:inline">{username}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-background text-foreground dark:bg-background dark:text-foreground rounded shadow-lg">
              <DropdownMenuLabel>Session {sessionId}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="flex items-center gap-2 p-2 cursor-pointer hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent dark:hover:text-accent-foreground" onClick={handleDeleteChat}>
                <Trash className="mr-2 h-4 w-4 text-destructive dark:text-destructive" />
                <span className="text-destructive dark:text-destructive">Delete Chat</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center gap-2 p-2 cursor-pointer hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent dark:hover:text-accent-foreground" onClick={onEndSession}>
                <PowerOff className="mr-2 h-4 w-4" />
                <span>End Session</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border dark:bg-border" />
              <DropdownMenuItem className="flex items-center gap-2 p-2 cursor-pointer hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent dark:hover:text-accent-foreground">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center gap-2 p-2 cursor-pointer hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent dark:hover:text-accent-foreground">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
