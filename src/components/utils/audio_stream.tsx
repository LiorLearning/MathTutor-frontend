import React, { useState, useEffect, useCallback, useRef, createContext, ReactNode } from 'react';

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
  const messageIdRef = useRef<string | null>(null);
  
  const bufferAheadTime = 0.2;
  const scheduleInterval = 50;
  const fadeInDuration = 0.015;

  const connectWebSocket = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
    }

    wsRef.current = new WebSocket(`${process.env.NEXT_PUBLIC_WS_BASE_URL}/cartesia/${clientId}/ws`);
    
    wsRef.current.onopen = () => {
      console.log('WebSocket connection opened');
      setIsConnected(true);
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    };
    
    wsRef.current.onclose = () => {
      console.log('WebSocket connection closed');
      setIsConnected(false);
    };
    
    wsRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };
    
    wsRef.current.onmessage = async (event) => {
      console.log('WebSocket message received:', event);
      if (event.data instanceof Blob) {
        const arrayBuffer = await event.data.arrayBuffer();
        const audioData = new Float32Array(arrayBuffer);
        scheduleAudioData(audioData);
      } else {
        try {
          const data = JSON.parse(event.data);
          const type = data.type;
          
          if (type === 'stream_start') {
            const messageId = data.messageId;
            messageIdRef.current = messageId;
          } else if (type === 'stream_end') {
            if (messageIdRef.current) {
              isFirstChunkRef.current[messageIdRef.current] = true;
              messageIdRef.current = null;
            }
          }
        } catch (e) {
          console.error('Error parsing message:', e);
        }
      }
    };
  }, [clientId]);
  
  const scheduleAudioData = useCallback((audioData: Float32Array) => {
    if (!audioContextRef.current) return;
    if (!messageIdRef.current) return;

    const source = audioContextRef.current.createBufferSource();
    const gainNode = audioContextRef.current.createGain();
    
    const audioBuffer = audioContextRef.current.createBuffer(1, audioData.length, 24000);
    audioBuffer.getChannelData(0).set(audioData);
    source.buffer = audioBuffer;

    source.connect(gainNode);
    gainNode.connect(audioContextRef.current.destination);
    
    let startTime: number;
    if (isFirstChunkRef.current[messageIdRef.current]) {
      startTime = audioContextRef.current.currentTime + 0.1;
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(1, startTime + fadeInDuration);
      isFirstChunkRef.current[messageIdRef.current] = false;
      // updateMessageState(messageId, { isPlaying: true });
    } else {
      startTime = Math.max(
        nextStartTimeRef.current[messageIdRef.current] || 0,
        audioContextRef.current.currentTime + bufferAheadTime
      );
    }
    
    source.start(startTime);
    // updateMessageState(messageId, { isPlaying: true });
    console.log(`Audio playback started for messageId: ${messageIdRef.current}`);
    
    if (!scheduledAudioRef.current[messageIdRef.current]) {
      scheduledAudioRef.current[messageIdRef.current] = [];
    }
    scheduledAudioRef.current[messageIdRef.current].push({ source, gain: gainNode, startTime });
    
    nextStartTimeRef.current[messageIdRef.current] = startTime + audioBuffer.duration;

    source.onended = () => {
      if (messageIdRef.current) {
        const audioChunks = scheduledAudioRef.current[messageIdRef.current];
        const isLastChunk = audioChunks[audioChunks.length - 1].source === source;
        
        if (isLastChunk) {
          // updateMessageState(messageId, { isPlaying: false });
          console.log(`Audio playback ended for messageId: ${messageIdRef.current}`);
        }
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
    connectWebSocket();
    return () => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
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