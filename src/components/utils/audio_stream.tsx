import React, { useState, useEffect, useCallback, useRef, createContext, useContext, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Loader2, MicIcon, StopCircle, PlayIcon, WifiIcon, WifiOffIcon } from 'lucide-react';


interface AudioContextProps {
  isConnected: boolean;
  wsRef: React.MutableRefObject<WebSocket | null>;
  audioContextRef: React.MutableRefObject<AudioContext | null>;
  scheduledAudioRef: React.MutableRefObject<Record<string, { source: AudioBufferSourceNode; gain: GainNode; startTime: number; }[]>>;
  nextStartTimeRef: React.MutableRefObject<Record<string, number>>;
  isFirstChunkRef: React.MutableRefObject<Record<string, boolean>>;
}

export const AudioContext = createContext<AudioContextProps | null>(null);

interface AudioProviderProps {
  children: ReactNode;
  clientId: string;
}

export const AudioProvider: React.FC<AudioProviderProps> = ({ children, clientId }) => {
  const [isConnected, setIsConnected] = useState(false);
  
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const scheduledAudioRef = useRef<Record<string, { source: AudioBufferSourceNode; gain: GainNode; startTime: number; }[]>>({});
  const nextStartTimeRef = useRef<Record<string, number>>({});
  const isFirstChunkRef = useRef<Record<string, boolean>>({});
  
  const bufferAheadTime = 0.2;
  const scheduleInterval = 50;
  const fadeInDuration = 0.015;

  const connectWebSocket = useCallback(() => {
    const ws = new WebSocket(`${process.env.NEXT_PUBLIC_WS_BASE_URL}/cartesia/${clientId}/ws`);
    
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
            console.error(`Error for messageId ${messageId}: ${message.message}`);
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
  }, [clientId]);
  
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
      startTime = audioContextRef.current.currentTime + 0.1;
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(1, startTime + fadeInDuration);
      isFirstChunkRef.current[messageId] = false;
      // updateMessageState(messageId, { isPlaying: true });
    } else {
      startTime = Math.max(
        nextStartTimeRef.current[messageId] || 0,
        audioContextRef.current.currentTime + bufferAheadTime
      );
    }
    
    source.start(startTime);
    // updateMessageState(messageId, { isPlaying: true });
    console.log(`Audio playback started for messageId: ${messageId}`);
    
    if (!scheduledAudioRef.current[messageId]) {
      scheduledAudioRef.current[messageId] = [];
    }
    scheduledAudioRef.current[messageId].push({ source, gain: gainNode, startTime });
    
    nextStartTimeRef.current[messageId] = startTime + audioBuffer.duration;

    source.onended = () => {
      const audioChunks = scheduledAudioRef.current[messageId];
      const isLastChunk = audioChunks[audioChunks.length - 1].source === source;
      
      if (isLastChunk) {
        // updateMessageState(messageId, { isPlaying: false });
        console.log(`Audio playback ended for messageId: ${messageId}`);
      }
    };
  }, []);
  
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
      wsRef,
      audioContextRef,
      scheduledAudioRef,
      nextStartTimeRef,
      isFirstChunkRef
    }}>
      {children}
    </AudioContext.Provider>
  );
};