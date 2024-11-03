import React, { useState, useEffect, useCallback, useRef, createContext, useContext, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Loader2, MicIcon, StopCircle, PlayIcon, WifiIcon, WifiOffIcon } from 'lucide-react';

interface MessageState {
  id: string;
  isPlaying: boolean;
  error: string;
}

interface AudioContextProps {
  isConnected: boolean;
  messageStates: Record<string, MessageState>;
  wsRef: React.MutableRefObject<WebSocket | null>;
  audioContextRef: React.MutableRefObject<AudioContext | null>;
  scheduledAudioRef: React.MutableRefObject<Record<string, { source: AudioBufferSourceNode; gain: GainNode; startTime: number; }[]>>;
  nextStartTimeRef: React.MutableRefObject<Record<string, number>>;
  isFirstChunkRef: React.MutableRefObject<Record<string, boolean>>;
  updateMessageState: (messageId: string, updates: Partial<MessageState>) => void;
}

export const AudioContext = createContext<AudioContextProps | null>(null);

interface AudioProviderProps {
  children: ReactNode;
}

export const AudioProvider: React.FC<AudioProviderProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [messageStates, setMessageStates] = useState<Record<string, MessageState>>({});
  
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const scheduledAudioRef = useRef<Record<string, { source: AudioBufferSourceNode; gain: GainNode; startTime: number; }[]>>({});
  const nextStartTimeRef = useRef<Record<string, number>>({});
  const isFirstChunkRef = useRef<Record<string, boolean>>({});
  
  const bufferAheadTime = 0.2;
  const scheduleInterval = 50;
  const fadeInDuration = 0.015;
  
  const updateMessageState = useCallback((messageId: string, updates: Partial<MessageState>) => {
    setMessageStates(prev => ({
      ...prev,
      [messageId]: {
        ...prev[messageId],
        ...updates
      }
    }));
  }, []);

  const connectWebSocket = useCallback(() => {
    const clientId = Math.random().toString(36).substring(7);
    const ws = new WebSocket(`ws://localhost:8000/api/v1/cartesia/ws/${clientId}`);
    
    ws.onopen = () => {
      setIsConnected(true);
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    };
    
    ws.onclose = () => {
      setIsConnected(false);
    };
    
    ws.onerror = () => {
      setIsConnected(false);
    };
    
    ws.onmessage = async (event) => {
      if (event.data instanceof Blob) {
        const arrayBuffer = await event.data.arrayBuffer();
        const audioData = new Float32Array(arrayBuffer);
        const metadata = ws.url.split('/').pop(); // Extract messageId from URL
        if (metadata) {
          scheduleAudioData(audioData, metadata);
        }
      } else {
        try {
          const message = JSON.parse(event.data);
          const messageId = message.messageId;
          
          if (message.type === 'error') {
            updateMessageState(messageId, { error: message.message });
          } else if (message.type === 'stream_end') {
            isFirstChunkRef.current[messageId] = true;
          }
        } catch (e) {
          console.error('Error parsing message:', e);
        }
      }
    };
    
    wsRef.current = ws;
    return ws;
  }, [updateMessageState]);
  
  const scheduleAudioData = useCallback((audioData: Float32Array, messageId: string) => {
    if (!audioContextRef.current) return;

    const source = audioContextRef.current.createBufferSource();
    const gainNode = audioContextRef.current.createGain();
    
    const audioBuffer = audioContextRef.current.createBuffer(1, audioData.length, 24000);
    audioBuffer.getChannelData(0).set(audioData);
    source.buffer = audioBuffer;

    source.connect(gainNode);
    gainNode.connect(audioContextRef.current.destination);
    
    let startTime: number;
    if (isFirstChunkRef.current[messageId]) {
      startTime = audioContextRef.current.currentTime + 0.1; // Reduced from 0.5 for faster start
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(1, startTime + fadeInDuration);
      isFirstChunkRef.current[messageId] = false;
      updateMessageState(messageId, { isPlaying: true });
    } else {
      startTime = Math.max(
        nextStartTimeRef.current[messageId] || 0,
        audioContextRef.current.currentTime + bufferAheadTime
      );
    }
    
    source.start(startTime);
    updateMessageState(messageId, { isPlaying: true });
    console.log(`Audio playback started for messageId: ${messageId}`);
    
    if (!scheduledAudioRef.current[messageId]) {
      scheduledAudioRef.current[messageId] = [];
    }
    scheduledAudioRef.current[messageId].push({ source, gain: gainNode, startTime });
    
    nextStartTimeRef.current[messageId] = startTime + audioBuffer.duration;

    // Check if this is the last scheduled audio chunk
    source.onended = () => {
      const audioChunks = scheduledAudioRef.current[messageId];
      const isLastChunk = audioChunks[audioChunks.length - 1].source === source;
      
      if (isLastChunk) {
        updateMessageState(messageId, { isPlaying: false });
        console.log(`Audio playback ended for messageId: ${messageId}`);
      }
    };
  }, [updateMessageState]);
  
  const cleanupFinishedAudio = useCallback(() => {
    if (!audioContextRef.current) return;
    
    const currentTime = audioContextRef.current.currentTime;
    Object.keys(scheduledAudioRef.current).forEach(messageId => {
      scheduledAudioRef.current[messageId] = scheduledAudioRef.current[messageId].filter(({ source, gain, startTime }) => {
        if (startTime + (source.buffer?.duration || 0) < currentTime) {
          source.disconnect();
          gain.disconnect();
          return false;
        }
        return true;
      });
    });
  }, []);
  
  useEffect(() => {
    const interval = setInterval(cleanupFinishedAudio, scheduleInterval);
    return () => clearInterval(interval);
  }, [cleanupFinishedAudio]);
  
  useEffect(() => {
    const ws = connectWebSocket();
    return () => {
      ws.close();
    };
  }, [connectWebSocket]);
  
  return (
    <AudioContext.Provider value={{
      isConnected,
      messageStates,
      wsRef,
      audioContextRef,
      scheduledAudioRef,
      nextStartTimeRef,
      isFirstChunkRef,
      updateMessageState
    }}>
      {children}
    </AudioContext.Provider>
  );
};

interface MessageCardProps {
  message: string;
  index: number;
}

const MessageCard: React.FC<MessageCardProps> = ({ message, index }) => {
  const messageId = `message-${index}`;
  const context = useContext(AudioContext);

  if (!context) {
    throw new Error('MessageCard must be used within an AudioProvider');
  }

  const { 
    isConnected,
    messageStates,
    wsRef,
    audioContextRef,
    scheduledAudioRef,
    nextStartTimeRef,
    isFirstChunkRef,
    updateMessageState
  } = context;

  const messageState = messageStates[messageId] || {
    id: messageId,
    isPlaying: false,
    error: ''
  };

  const handleTTSRequest = () => {
    if (!message.trim()) {
      updateMessageState(messageId, { error: 'Empty message' });
      return;
    }
    
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      updateMessageState(messageId, { error: 'WebSocket is not connected' });
      return;
    }
    
    updateMessageState(messageId, { error: '' });
    isFirstChunkRef.current[messageId] = true;
    
    if (audioContextRef.current) {
      nextStartTimeRef.current[messageId] = audioContextRef.current.currentTime;
    }
    
    wsRef.current.send(JSON.stringify({
      type: 'tts_request',
      text: message.trim(),
      messageId
    }));
  };

  const handleStop = () => {
    if (audioContextRef.current && scheduledAudioRef.current[messageId]) {
      scheduledAudioRef.current[messageId].forEach(({ source, gain }) => {
        try {
          source.stop();
          source.disconnect();
          gain.disconnect();
        } catch (e) {
          // Ignore errors from already stopped sources
        }
      });
      scheduledAudioRef.current[messageId] = [];
      
      updateMessageState(messageId, { isPlaying: false });
      isFirstChunkRef.current[messageId] = true;
      nextStartTimeRef.current[messageId] = audioContextRef.current.currentTime;
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>Message {index + 1}</CardTitle>
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleTTSRequest}
            disabled={!message || messageState.isPlaying || !isConnected}
          >
            <PlayIcon className="h-4 w-4" />
          </Button>
          
          {messageState.isPlaying && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleStop}
              disabled={!messageState.isPlaying}
            >
              <StopCircle className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p>{message}</p>
        <p>isPlaying: {messageState.isPlaying}</p>
        {messageState.error && (
          <p className="text-sm text-red-500 mt-2">{messageState.error}</p>
        )}
      </CardContent>
    </Card>
  );
};

export default MessageCard;