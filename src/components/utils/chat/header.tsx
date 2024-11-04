import React, { useContext } from 'react';

interface HeaderProps {
  username: string;
  isAudioConnected: boolean;
}

const Header: React.FC<HeaderProps> = ({ username, isAudioConnected }) => {
  return (
    <header className="pb-4 px-4 border-b border-border">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">MathTutor</h1>
        <div className="flex items-center gap-2">
          <h3 className="text-lg text-muted-foreground">{username}</h3>
          {isAudioConnected ? (
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          ) : (
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;