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
  const audioBufferQueueRef = useRef<Record<string, Float32Array[]>>({});
  
  // Configuration constants
  const BUFFER_SIZE_THRESHOLD = 3; // Number of chunks to buffer before starting playback
  const BUFFER_AHEAD_TIME = 0.3; // Time to buffer ahead in seconds
  const SCHEDULE_INTERVAL = 50; // Milliseconds between cleanup checks
  const FADE_IN_DURATION = 0.05; // Duration of fade-in effect
  const FADE_OUT_DURATION = -0.05; // Duration of fade-out effect
  const MIN_BUFFER_DURATION = 0.5; // Minimum buffer duration in seconds
  
  const processAudioQueue = useCallback((messageId: string) => {
    if (!audioContextRef.current || !audioBufferQueueRef.current[messageId]) return;
    
    const queue = audioBufferQueueRef.current[messageId];
    if (!queue.length) return;

    // Calculate total buffered duration
    const totalBufferedDuration = queue.reduce((acc, chunk) => 
      acc + (chunk.length / 24000), 0);

    // Start processing if we have enough buffer or it's the end of the stream
    const shouldStartProcessing = totalBufferedDuration >= MIN_BUFFER_DURATION || 
      (isFirstChunkRef.current[messageId] === false && queue.length >= BUFFER_SIZE_THRESHOLD);

    if (shouldStartProcessing) {
      while (queue.length > 0) {
        const audioData = queue.shift()!;
        const source = audioContextRef.current.createBufferSource();
        const gainNode = audioContextRef.current.createGain();
        
        const audioBuffer = audioContextRef.current.createBuffer(1, audioData.length, 24000);
        audioBuffer.getChannelData(0).set(audioData);
        source.buffer = audioBuffer;

        source.connect(gainNode);
        gainNode.connect(audioContextRef.current.destination);
        
        let startTime: number;
        if (isFirstChunkRef.current[messageId]) {
          startTime = audioContextRef.current.currentTime + BUFFER_AHEAD_TIME;
          gainNode.gain.setValueAtTime(0, startTime);
          gainNode.gain.linearRampToValueAtTime(1, startTime + FADE_IN_DURATION);
          isFirstChunkRef.current[messageId] = false;
        } else {
          startTime = Math.max(
            nextStartTimeRef.current[messageId] || 0,
            audioContextRef.current.currentTime + BUFFER_AHEAD_TIME
          );
        }
        
        source.start(startTime);
        
        if (!scheduledAudioRef.current[messageId]) {
          scheduledAudioRef.current[messageId] = [];
        }
        scheduledAudioRef.current[messageId].push({ source, gain: gainNode, startTime });
        
        nextStartTimeRef.current[messageId] = startTime + audioBuffer.duration;

        // Handle the last chunk of audio
        source.onended = () => {
          const audioChunks = scheduledAudioRef.current[messageId];
          if (audioChunks && audioChunks[audioChunks.length - 1].source === source) {
            console.log(`Audio chunk ended for messageId: ${messageId}`);
          }
        };
      }
    }
  }, []);

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
      if (event.data instanceof Blob) {
        const arrayBuffer = await event.data.arrayBuffer();
        const audioData = new Float32Array(arrayBuffer);
        
        if (messageIdRef.current) {
          // Initialize queue if needed
          if (!audioBufferQueueRef.current[messageIdRef.current]) {
            audioBufferQueueRef.current[messageIdRef.current] = [];
          }
          
          // Add to queue
          audioBufferQueueRef.current[messageIdRef.current].push(audioData);
          
          // Process queue
          processAudioQueue(messageIdRef.current);
        }
      } else {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'stream_start') {
            messageIdRef.current = data.messageId;
            isFirstChunkRef.current[data.messageId] = true;
            audioBufferQueueRef.current[data.messageId] = [];
          } else if (data.type === 'stream_end') {
            if (messageIdRef.current) {
              // Process any remaining audio in the queue
              processAudioQueue(messageIdRef.current);
              
              // Apply fade out to the last scheduled audio chunk
              const audioChunks = scheduledAudioRef.current[messageIdRef.current];
              if (audioChunks && audioChunks.length > 0) {
                const lastChunk = audioChunks[audioChunks.length - 1];
                const endTime = lastChunk.startTime + (lastChunk.source.buffer?.duration || 0);
                lastChunk.gain.gain.setValueAtTime(1, endTime - FADE_OUT_DURATION);
                lastChunk.gain.gain.linearRampToValueAtTime(0, endTime);
              }
              
              messageIdRef.current = null;
            }
          }
        } catch (e) {
          console.error('Error parsing message:', e);
        }
      }
    };
  }, [clientId, processAudioQueue]);
  
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
      
      // Clean up empty message arrays
      if (scheduledAudioRef.current[messageId].length === 0) {
        delete scheduledAudioRef.current[messageId];
        delete nextStartTimeRef.current[messageId];
        delete audioBufferQueueRef.current[messageId];
      }
    });
  }, []);
  
  useEffect(() => {
    const interval = setInterval(cleanupFinishedAudio, SCHEDULE_INTERVAL);
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