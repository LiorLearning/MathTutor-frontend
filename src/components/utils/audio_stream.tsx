import React, { useState, useEffect, useCallback, useRef, createContext, useContext, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Loader2, MicIcon, StopCircle, PlayIcon } from 'lucide-react';

interface AudioContextProps {
  isConnected: boolean;
  isPlaying: boolean;
  error: string;
  isLoading: boolean;
  wsRef: React.MutableRefObject<WebSocket | null>;
  audioContextRef: React.MutableRefObject<AudioContext | null>;
  scheduledAudioRef: React.MutableRefObject<{ source: AudioBufferSourceNode; gain: GainNode; startTime: number; }[]>;
  nextStartTimeRef: React.MutableRefObject<number>;
  isFirstChunkRef: React.MutableRefObject<boolean>;
  setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setError: React.Dispatch<React.SetStateAction<string>>;
}

const AudioContext = createContext<AudioContextProps | null>(null);

interface AudioProviderProps {
  children: ReactNode;
}

export const AudioProvider: React.FC<AudioProviderProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const scheduledAudioRef = useRef<{
    source: AudioBufferSourceNode;
    gain: GainNode;
    startTime: number;
  }[]>([]);
  const nextStartTimeRef = useRef<number>(0);
  const isFirstChunkRef = useRef<boolean>(true);
  const bufferAheadTime = 0.2; // Schedule audio 200ms ahead
  const scheduleInterval = 50; // Check scheduling every 50ms
  const fadeInDuration = 0.015; // 15ms fade in
  
  // Initialize WebSocket connection
  const connectWebSocket = useCallback(() => {
    const clientId = Math.random().toString(36).substring(7);
    const ws = new WebSocket(`ws://localhost:8000/api/v1/cartesia/ws/${clientId}`);
    
    ws.onopen = () => {
      setIsConnected(true);
      setError('');
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      nextStartTimeRef.current = audioContextRef.current.currentTime;
    };
    
    ws.onclose = () => {
      setIsConnected(false);
    };
    
    ws.onerror = (event) => {
      setError('WebSocket connection error');
      setIsConnected(false);
    };
    
    ws.onmessage = async (event) => {
      if (event.data instanceof Blob) {
        const arrayBuffer = await event.data.arrayBuffer();
        const audioData = new Float32Array(arrayBuffer);
        scheduleAudioData(audioData);
      } else {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'error') {
            setError(message.message);
          } else if (message.type === 'stream_end') {
            setIsLoading(false);
            isFirstChunkRef.current = true;
          }
        } catch (e) {
          console.error('Error parsing message:', e);
        }
      }
    };
    
    wsRef.current = ws;
    return ws;
  }, []);
  
  // Schedule audio data for playback
  const scheduleAudioData = useCallback((audioData: Float32Array) => {
    if (!audioContextRef.current) return;

    // Create and configure audio nodes
    const source = audioContextRef.current.createBufferSource();
    const gainNode = audioContextRef.current.createGain();
    
    // Create and fill the audio buffer
    const audioBuffer = audioContextRef.current.createBuffer(1, audioData.length, 24000);
    audioBuffer.getChannelData(0).set(audioData);
    source.buffer = audioBuffer;

    // Connect nodes
    source.connect(gainNode);
    gainNode.connect(audioContextRef.current.destination);
    
    // Calculate start time
    let startTime: number;
    if (isFirstChunkRef.current) {
      // For first chunk, start almost immediately with minimal delay
      startTime = audioContextRef.current.currentTime + 0.5;
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(1, startTime + fadeInDuration);
      isFirstChunkRef.current = false;
    } else {
      startTime = Math.max(
        nextStartTimeRef.current,
        audioContextRef.current.currentTime + bufferAheadTime
      );
    }
    
    // Start the source
    source.start(startTime);
    setIsPlaying(true);
    scheduledAudioRef.current.push({ source, gain: gainNode, startTime });
    
    // Update next start time based on buffer duration
    nextStartTimeRef.current = startTime + audioBuffer.duration;

    // Stop the audio player a few ms after the audio has finished
    source.onended = () => {
      setTimeout(() => {
        setIsPlaying(false);
      }, 100); // 100ms after the audio has finished
    };
  }, []);
  
  // Clean up finished audio nodes
  const cleanupFinishedAudio = useCallback(() => {
    if (!audioContextRef.current) return;
    
    const currentTime = audioContextRef.current.currentTime;
    scheduledAudioRef.current = scheduledAudioRef.current.filter(({ source, gain, startTime }) => {
      if (startTime + (source.buffer?.duration || 0) < currentTime) {
        source.disconnect();
        gain.disconnect();
        return false;
      }
      return true;
    });
  }, []);
  
  // Set up scheduling interval
  useEffect(() => {
    const interval = setInterval(cleanupFinishedAudio, scheduleInterval);
    return () => clearInterval(interval);
  }, [cleanupFinishedAudio]);
  
  // Connect WebSocket on component mount
  useEffect(() => {
    const ws = connectWebSocket();
    return () => {
      ws.close();
    };
  }, [connectWebSocket]);
  
  return (
    <AudioContext.Provider value={{ isConnected, isPlaying, error, isLoading, wsRef, audioContextRef, scheduledAudioRef, nextStartTimeRef, isFirstChunkRef, setIsPlaying, setIsLoading, setError }}>
      {children}
    </AudioContext.Provider>
  );
};

interface MessageCardProps {
  message: string;
  index: number;
}

const MessageCard: React.FC<MessageCardProps> = ({ message, index }) => {
  const context = useContext(AudioContext);

  if (!context) {
    throw new Error('MessageCard must be used within an AudioProvider');
  }

  const { 
    isConnected, 
    isPlaying, 
    error, 
    isLoading, 
    wsRef, 
    audioContextRef, 
    scheduledAudioRef, 
    nextStartTimeRef, 
    isFirstChunkRef, 
    setIsPlaying, 
    setIsLoading, 
    setError 
  } = context;

  const handleTTSRequest = () => {
    if (!message.trim()) {
      setError('Empty message');
      return;
    }
    
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      setError('WebSocket is not connected');
      return;
    }
    
    setError('');
    setIsLoading(true);
    isFirstChunkRef.current = true;
    
    if (audioContextRef.current) {
      nextStartTimeRef.current = audioContextRef.current.currentTime;
    }
    
    wsRef.current.send(JSON.stringify({
      type: 'tts_request',
      text: message.trim()
    }));
  };

  const handleStop = () => {
    if (audioContextRef.current) {
      scheduledAudioRef.current.forEach(({ source, gain }) => {
        try {
          source.stop();
          source.disconnect();
          gain.disconnect();
        } catch (e) {
          // Ignore errors from already stopped sources
        }
      });
      scheduledAudioRef.current = [];
      
      audioContextRef.current.close().then(() => {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        nextStartTimeRef.current = audioContextRef.current.currentTime;
        isFirstChunkRef.current = true;
      });
    }
    setIsPlaying(false);
    setIsLoading(false);
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
            disabled={!message || isPlaying || !isConnected}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <PlayIcon className="h-4 w-4" />
            )}
          </Button>
          
          {isPlaying && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleStop}
              disabled={!isPlaying}
            >
              <StopCircle className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p>{message}</p>
        {error && (
          <p className="text-sm text-red-500 mt-2">{error}</p>
        )}
      </CardContent>
    </Card>
  );
};

export default MessageCard;