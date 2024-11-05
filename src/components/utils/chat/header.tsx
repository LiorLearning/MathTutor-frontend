import React from 'react';
import { Wifi, WifiOff } from 'lucide-react';

interface HeaderProps {
  username: string;
  isChatConnected: boolean;
}

const Header: React.FC<HeaderProps> = ({ username, isChatConnected }) => {
  return (
    <header className="pb-4 px-4 border-b border-border">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">MathTutor</h1>
        <div className="flex items-center gap-2">
          <h3 className="text-lg text-muted-foreground">{username}</h3>
          {(isChatConnected) ? (
            <Wifi className="text-green-500" size={20} />
          ) : (
            <WifiOff className="text-red-500" size={20} />
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;