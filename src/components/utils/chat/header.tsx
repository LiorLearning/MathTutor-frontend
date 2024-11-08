import React from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { DarkModeToggle } from '@/components/themeContext';

interface HeaderProps {
  username: string;
  isChatConnected: boolean;
}

const Header: React.FC<HeaderProps> = ({ username, isChatConnected }) => {
  return (
    <header className="pb-2 px-4 border-b border-border bg-background text-foreground">
      <div className="flex justify-between items-center">
        <h1 className="text-lg font-bold">MathTutor</h1>
        <div className="flex items-center gap-2">
          <h3 className="text-base text-muted-foreground">{username}</h3>
          {(isChatConnected) ? (
            <Wifi className="text-green-500" size={16} />
          ) : (
            <WifiOff className="text-red-500" size={16} />
          )}
          <DarkModeToggle />
        </div>
      </div>
    </header>
  );
};

export default Header;