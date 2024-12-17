import React from 'react';
import { Wifi, WifiOff, Volume2, VolumeX, User, Settings, LogOut } from 'lucide-react';
import { DarkModeToggle } from '@/components/themeContext';
import { Button } from "@/components/ui/button";
import AudioSelector from '@/components/audio-selector';
import { ANDROID_PHONE, IPHONE } from '@/components/utils/common_utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface HeaderProps {
  username: string;
  sessionId: string;
  isChatConnected: boolean;
  speakout: boolean;
  toggleSpeakout: () => void;
  deviceType: string;
  compact: boolean;
}

const Header: React.FC<HeaderProps> = ({ username, sessionId, isChatConnected, speakout, toggleSpeakout, deviceType, compact }) => {
  const isPhone = deviceType === ANDROID_PHONE || deviceType === IPHONE;

  return (
    <header className={`pb-2 px-4 border-b border-border bg-background text-foreground sticky top-0 z-10 ${isPhone ? 'pt-2' : ''}`}>
      <div className="flex justify-between items-center">
        <h1 className="text-lg font-bold">MathTutor</h1>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            {isChatConnected ? (
              <div className="flex items-center gap-2">
                <Wifi className="text-green-500" size={16} />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <WifiOff className="text-red-500" size={16} />
              </div>
            )}
          </div>
          <DarkModeToggle />
          <Button 
            onClick={toggleSpeakout} 
            className="p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            variant="ghost"
          >
            {speakout ? (
              <div className="flex items-center gap-2">
                <Volume2 size={16} />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <VolumeX size={16} />
              </div>
            )}
          </Button>
          
          <div className="hidden md:block">
            <AudioSelector />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2">
                <User size={16} />
                <span className="hidden sm:inline">{username}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Session {sessionId}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              
              {/* Conditionally render Audio Selector for smaller screens */}
              {compact && (
                <>
                  <DropdownMenuItem onSelect={(event) => event.preventDefault()}>
                    <AudioSelector />
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              
              <DropdownMenuItem>
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

export default Header;