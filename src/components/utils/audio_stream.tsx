import React, { useState, useEffect, useCallback, useRef, createContext, useContext, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Loader2, MicIcon, StopCircle } from 'lucide-react';

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

interface AudioStreamProps {
  text: string;
  setText: React.Dispatch<React.SetStateAction<string>>;
}

export const AudioStream: React.FC<AudioStreamProps> = ({ text, setText }) => {
  const context = useContext(AudioContext);

  if (!context) {
    throw new Error('AudioStream must be used within an AudioProvider');
  }

  const { isConnected, isPlaying, error, isLoading, wsRef, audioContextRef, scheduledAudioRef, nextStartTimeRef, isFirstChunkRef, setIsPlaying, setIsLoading, setError } = context;

  // Handle TTS request
  const handleTTSRequest = useCallback(() => {
    if (!text.trim()) {
      setError('Please enter some text');
      return;
    }
    
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      setError('WebSocket is not connected');
      return;
    }
    
    setError('');
    setIsLoading(true);
    isFirstChunkRef.current = true;
    
    // Reset audio scheduling state
    if (audioContextRef.current) {
      nextStartTimeRef.current = audioContextRef.current.currentTime;
    }
    
    wsRef.current.send(JSON.stringify({
      type: 'tts_request',
      text: text.trim()
    }));
  }, [text, wsRef, audioContextRef, nextStartTimeRef, isFirstChunkRef, setError, setIsLoading]);
  
  // Handle stop
  const handleStop = useCallback(() => {
    if (audioContextRef.current) {
      // Stop all scheduled audio
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
      
      // Reset audio context
      audioContextRef.current.close().then(() => {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        nextStartTimeRef.current = audioContextRef.current.currentTime;
        isFirstChunkRef.current = true;
      });
    }
    setIsPlaying(false);
    setIsLoading(false);
  }, [audioContextRef, scheduledAudioRef, nextStartTimeRef, isFirstChunkRef, setIsPlaying, setIsLoading]);
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Text to Speech</span>
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {error && (
          <div className="text-red-500">{error}</div>
        )}
        
        <div className="space-y-2">
          <Input
            placeholder="Enter text to convert to speech..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={isPlaying || !isConnected}
          />
          
          <div className="flex space-x-2">
            <Button
              className="flex-1"
              onClick={handleTTSRequest}
              disabled={!text || isPlaying || !isConnected}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <MicIcon className="mr-2 h-4 w-4" />
              )}
              {isLoading ? 'Converting...' : 'Speak'}
            </Button>
            
            {isPlaying && (
              <Button
                variant="destructive"
                onClick={handleStop}
                disabled={!isPlaying}
              >
                <StopCircle className="mr-2 h-4 w-4" />
                Stop
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AudioStream;