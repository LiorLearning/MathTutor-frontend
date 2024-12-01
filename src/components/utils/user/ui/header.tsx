import React from 'react';
import { Wifi, WifiOff, Volume2, VolumeX } from 'lucide-react';
import { DarkModeToggle } from '@/components/themeContext';
import { Button } from "@/components/ui/button";
import AudioSelector from '@/components/audio-selector';
import { ANDROID_PHONE, IPHONE } from '@/components/utils/common_utils';

interface HeaderProps {
  username: string;
  isChatConnected: boolean;
  speakout: boolean;
  toggleSpeakout: () => void;
  deviceType: string;
}

const Header: React.FC<HeaderProps> = ({ username, isChatConnected, speakout, toggleSpeakout, deviceType }) => {
  const isPhone = deviceType === ANDROID_PHONE || deviceType === IPHONE;

  return (
    <header className={`pb-2 px-4 border-b border-border bg-background text-foreground sticky top-0 z-10`}>
      <div className="flex justify-between items-center">
        <h1 className="text-lg font-bold">MathTutor</h1>
        <div className="flex items-center gap-2">
          {!isPhone && <h3 className="text-base text-muted-foreground">{username}</h3>}
          <div className="mx-4">
            <AudioSelector />
          </div>
          {isChatConnected ? (
            <Wifi className="text-green-500" size={16} />
          ) : (
            <WifiOff className="text-red-500" size={16} />
          )}
          <DarkModeToggle />
          <Button 
            onClick={toggleSpeakout} 
            className="p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            variant="ghost"
          >
            {speakout ? (
              <Volume2 size={16} />
            ) : (
              <VolumeX size={16} />
            )}
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;