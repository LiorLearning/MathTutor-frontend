import React, { useState, useEffect, useCallback, useRef, createContext, ReactNode } from 'react';

interface AudioContextProps {
  isConnected: boolean;
  playAudio: (messageId: string, text: string) => void;
  stopAudio: (messageId?: string) => void;
}

export const AudioContext = createContext<AudioContextProps | null>(null);

interface AudioProviderProps {
  children: ReactNode;
  clientId: string;
  setIsPlaying: (messageId: string, isPlaying: boolean) => void;
}

export const AudioProvider: React.FC<AudioProviderProps> = ({ children, clientId, setIsPlaying }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const scheduledAudioRef = useRef<Record<string, { source: AudioBufferSourceNode; gain: GainNode; startTime: number; }[]>>({});
  const nextStartTimeRef = useRef<Record<string, number>>({});
  const isFirstChunkRef = useRef<Record<string, boolean>>({});
  const audioBufferQueueRef = useRef<Record<string, Float32Array[]>>({});
  const webSocketRef = useRef<WebSocket | null>(null);

  // Configuration constants
  const BUFFER_SIZE_THRESHOLD = 3;
  const BUFFER_AHEAD_TIME = 0.3;
  const SCHEDULE_INTERVAL = 50;
  const FADE_IN_DURATION = 0.05;
  const FADE_OUT_DURATION = -0.1;
  const MIN_BUFFER_DURATION = 0.5;

  // Initialize or resume AudioContext
  const initializeAudioContext = useCallback(async () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    // Handle suspended state in Safari
    if (audioContextRef.current.state === 'suspended') {
      try {
        await audioContextRef.current.resume();
      } catch (error) {
        console.error('Failed to resume AudioContext:', error);
      }
    }
  }, []);

  // Add interaction handler
  useEffect(() => {
    const handleInteraction = async () => {
      if (!hasInteracted) {
        await initializeAudioContext();
        setHasInteracted(true);
      }
    };

    // Add listeners for common user interactions
    const interactionEvents = ['touchstart', 'touchend', 'click', 'keydown'];
    interactionEvents.forEach(event => 
      document.addEventListener(event, handleInteraction, { once: true })
    );

    return () => {
      interactionEvents.forEach(event =>
        document.removeEventListener(event, handleInteraction)
      );
    };
  }, [hasInteracted, initializeAudioContext]);

  const playAudio = useCallback(async (messageId: string, text: string) => {
    // Ensure AudioContext is initialized and resumed
    await initializeAudioContext();
    
    connectWebSocket(messageId);
    
    const waitForConnection = () => {
      return new Promise<void>((resolve) => {
        if (webSocketRef.current?.readyState === WebSocket.OPEN) {
          resolve();
        } else {
          const checkConnection = () => {
            if (webSocketRef.current?.readyState === WebSocket.OPEN) {
              resolve();
            } else {
              setTimeout(checkConnection, 100);
            }
          };
          checkConnection();
        }
      });
    };

    // Wait for connection before proceeding
    waitForConnection().then(() => {
      setIsPlaying(messageId, true);
      
      if (webSocketRef.current) {
        webSocketRef.current.send(JSON.stringify({
          type: 'tts_request', 
          text: text.trim(),
          id: messageId,
        }));
      }
      
      processAudioQueue(messageId);
    });

  }, [setIsPlaying, initializeAudioContext]);

  const stopAudio = useCallback((messageId?: string) => {
    if (!audioContextRef.current) {
      return;
    }

    // Disconnect current websocket if it exists
    if (webSocketRef.current) {
      webSocketRef.current.close();
      webSocketRef.current = null;
    }

    const currentTime = audioContextRef.current.currentTime;
    const messageIds = messageId ? [messageId] : Object.keys(scheduledAudioRef.current);

    messageIds.forEach(id => {
      if (scheduledAudioRef.current[id]) {
        scheduledAudioRef.current[id].forEach(({ source, gain }) => {
          try {
            gain.gain.cancelScheduledValues(currentTime);
            gain.gain.setValueAtTime(gain.gain.value, currentTime);
            gain.gain.linearRampToValueAtTime(0, currentTime + 0.05);

            setTimeout(() => {
              try {
                source.stop();
                source.disconnect();
                gain.disconnect();
              } catch (e) {
                console.error(`Error stopping audio for messageId: ${id}`, e);
              }
            }, 60);
          } catch (e) {
            console.error(`Error during fade out for messageId: ${id}`, e);
          }
        });

        delete scheduledAudioRef.current[id];
        delete nextStartTimeRef.current[id];
        delete isFirstChunkRef.current[id];
        delete audioBufferQueueRef.current[id];
      }
    });

    if (messageId) {
      setIsPlaying(messageId, false);
    }
  }, [setIsPlaying]);

  const processAudioQueue = useCallback((messageId: string, is_end: boolean = false) => {
    setTimeout(() => {
      if (is_end) {
        setIsPlaying(messageId, false);
      }
    }, 2000);
    
    if (!audioContextRef.current || !audioBufferQueueRef.current[messageId]) {
      return;
    }

    const queue = audioBufferQueueRef.current[messageId];
    if (!queue.length) {
      return;
    }

    const scheduledDuration = (scheduledAudioRef.current[messageId] || [])
      .reduce((acc, { source }) => acc + (source.buffer?.duration || 0), 0);
    const queuedDuration = queue.reduce((acc, chunk) => acc + (chunk.length / 24000), 0);
    const totalBufferedDuration = scheduledDuration + queuedDuration;

    if (totalBufferedDuration >= MIN_BUFFER_DURATION || (queue.length >= BUFFER_SIZE_THRESHOLD)) {
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
      }
    }
  }, []);

  const connectWebSocket = useCallback((messageId: string) => {
    if (webSocketRef.current) {
      webSocketRef.current.close();
    }

    webSocketRef.current = new WebSocket(`${process.env.NEXT_PUBLIC_WS_BASE_URL}/cartesia/${messageId}/ws`);

    webSocketRef.current.onopen = () => {
      setIsConnected(true);
    };

    webSocketRef.current.onclose = () => {
      setIsConnected(false);
    };

    webSocketRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };

    webSocketRef.current.onmessage = async (event) => {
      if (event.data instanceof Blob) {
        const arrayBuffer = await event.data.arrayBuffer();
        const audioData = new Float32Array(arrayBuffer);

        if (!audioBufferQueueRef.current[messageId]) {
          audioBufferQueueRef.current[messageId] = [];
        }

        audioBufferQueueRef.current[messageId].push(audioData);
        processAudioQueue(messageId);
      } else {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'stream_start') {
            isFirstChunkRef.current[data.messageId] = true;
            audioBufferQueueRef.current[data.messageId] = [];
          } else if (data.type === 'stream_end') {
            processAudioQueue(data.messageId, true);

            await new Promise(resolve => setTimeout(resolve, 50));

            const audioChunks = scheduledAudioRef.current[data.messageId];
            if (audioChunks && audioChunks.length > 0) {
              const lastChunk = audioChunks[audioChunks.length - 1];
              const endTime = lastChunk.startTime + (lastChunk.source.buffer?.duration || 0);
              lastChunk.gain.gain.setValueAtTime(1, endTime - FADE_OUT_DURATION);
              lastChunk.gain.gain.linearRampToValueAtTime(0, endTime);
            }

            if (webSocketRef.current) {
              webSocketRef.current.close();
              webSocketRef.current = null;
            }
          }
        } catch (e) {
          console.error('Error parsing message:', e);
        }
      }
    };
  }, [clientId, processAudioQueue, stopAudio]);

  const cleanupFinishedAudio = useCallback(() => {
    if (!audioContextRef.current) return;

    const currentTime = audioContextRef.current.currentTime;
    Object.keys(scheduledAudioRef.current).forEach(messageId => {
      scheduledAudioRef.current[messageId] = scheduledAudioRef.current[messageId].filter(({ source, gain, startTime }) => {
        if (startTime + (source.buffer?.duration || 0) < currentTime) {
          if (currentTime > startTime + (source.buffer?.duration || 0) + 0.1) {
            try {
              gain.disconnect();
              source.disconnect();
            } catch (e) {
              console.error(`Error during cleanup for messageId: ${messageId}`, e);
            }
          }
          return false;
        }
        return true;
      });

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

  return (
    <AudioContext.Provider
      value={{
        isConnected,
        playAudio,
        stopAudio,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
};