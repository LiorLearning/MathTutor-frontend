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
  // const [audioContextInitialized, setAudioContextInitialized] = useState(false);

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

  // Initialize AudioContext on component mount
  useEffect(() => {
    const initAudioContext = async () => {
      try {
        // Force sample rate to 48000 for Safari compatibility
        const options = {
          sampleRate: 48000,
          latencyHint: 'interactive' as AudioContextLatencyCategory
        };
        
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)(options);
        
        // Create and connect a dummy oscillator to initialize audio chain
        const oscillator = audioContextRef.current.createOscillator();
        const gainNode = audioContextRef.current.createGain();
        gainNode.gain.value = 0; // Mute it
        oscillator.connect(gainNode);
        gainNode.connect(audioContextRef.current.destination);
        oscillator.start();
        oscillator.stop(audioContextRef.current.currentTime + 0.001);
        
        // setAudioContextInitialized(true);
        console.log('AudioContext initialized:', audioContextRef.current.state);
      } catch (error) {
        console.error('Failed to initialize AudioContext:', error);
      }
    };

    initAudioContext();

    // Cleanup
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Handle user interaction to unlock audio
  useEffect(() => {
    const unlockAudio = async () => {
      if (!audioContextRef.current) return;

      try {
        if (audioContextRef.current.state === 'suspended') {
          await audioContextRef.current.resume();
          console.log('AudioContext resumed:', audioContextRef.current.state);
        }
      } catch (error) {
        console.error('Failed to resume AudioContext:', error);
      }
    };

    const handleInteraction = () => {
      unlockAudio();
    };

    ['touchstart', 'touchend', 'click', 'keydown'].forEach(event => {
      document.addEventListener(event, handleInteraction, { once: true });
    });

    return () => {
      ['touchstart', 'touchend', 'click', 'keydown'].forEach(event => {
        document.removeEventListener(event, handleInteraction);
      });
    };
  }, []);

  const playAudio = useCallback(async (messageId: string, text: string) => {
    console.log('playAudio called:', { messageId, audioContextState: audioContextRef.current?.state });
    
    if (!audioContextRef.current || audioContextRef.current.state === 'suspended') {
      try {
        await audioContextRef.current?.resume();
        console.log('AudioContext resumed in playAudio');
      } catch (error) {
        console.error('Failed to resume AudioContext in playAudio:', error);
        return;
      }
    }
    
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

    waitForConnection().then(() => {
      setIsPlaying(messageId, true);
      
      if (webSocketRef.current) {
        webSocketRef.current.send(JSON.stringify({
          type: 'tts_request', 
          text: text.trim(),
          id: messageId,
        }));
      }
    });
  }, [setIsPlaying]);

  const processAudioQueue = useCallback((messageId: string, is_end: boolean = false) => {
    console.log('Processing audio queue:', { messageId, is_end, queueLength: audioBufferQueueRef.current[messageId]?.length });
    
    setTimeout(() => {
      if (is_end) {
        setIsPlaying(messageId, false);
      }
    }, 2000);
    
    if (!audioContextRef.current || !audioBufferQueueRef.current[messageId]) {
      console.log('No AudioContext or queue:', { 
        hasAudioContext: !!audioContextRef.current,
        hasQueue: !!audioBufferQueueRef.current[messageId]
      });
      return;
    }

    const queue = audioBufferQueueRef.current[messageId];
    if (!queue.length) return;

    const scheduledDuration = (scheduledAudioRef.current[messageId] || [])
      .reduce((acc, { source }) => acc + (source.buffer?.duration || 0), 0);
    const queuedDuration = queue.reduce((acc, chunk) => acc + (chunk.length / 24000), 0);
    const totalBufferedDuration = scheduledDuration + queuedDuration;

    if (totalBufferedDuration >= MIN_BUFFER_DURATION || (queue.length >= BUFFER_SIZE_THRESHOLD)) {
      while (queue.length > 0) {
        const audioData = queue.shift()!;
        const source = audioContextRef.current.createBufferSource();
        const gainNode = audioContextRef.current.createGain();
        
        try {
          const audioBuffer = audioContextRef.current.createBuffer(1, audioData.length, 24000);
          audioBuffer.getChannelData(0).set(audioData);
          source.buffer = audioBuffer;

          source.connect(gainNode);
          gainNode.connect(audioContextRef.current.destination);
          
          console.log('Audio node connected:', {
            bufferLength: audioData.length,
            sampleRate: audioBuffer.sampleRate,
            duration: audioBuffer.duration
          });

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
          console.log('Started audio source:', { startTime, currentTime: audioContextRef.current.currentTime });

          if (!scheduledAudioRef.current[messageId]) {
            scheduledAudioRef.current[messageId] = [];
          }
          scheduledAudioRef.current[messageId].push({ source, gain: gainNode, startTime });

          nextStartTimeRef.current[messageId] = startTime + audioBuffer.duration;
        } catch (error) {
          console.error('Error processing audio chunk:', error);
        }
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
      console.log('WebSocket connected');
    };

    webSocketRef.current.onclose = () => {
      setIsConnected(false);
      console.log('WebSocket closed');
    };

    webSocketRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };

    webSocketRef.current.onmessage = async (event) => {
      if (event.data instanceof Blob) {
        try {
          const arrayBuffer = await event.data.arrayBuffer();
          const audioData = new Float32Array(arrayBuffer);
          console.log('Received audio chunk:', { 
            length: audioData.length,
            min: Math.min(...Array.from(audioData)),
            max: Math.max(...Array.from(audioData))
          });

          if (!audioBufferQueueRef.current[messageId]) {
            audioBufferQueueRef.current[messageId] = [];
          }

          audioBufferQueueRef.current[messageId].push(audioData);
          processAudioQueue(messageId);
        } catch (error) {
          console.error('Error processing audio data:', error);
        }
      } else {
        try {
          const data = JSON.parse(event.data);
          console.log('Received message:', data);

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
  }, [clientId, processAudioQueue]);

  // Rest of the code remains the same...
  const stopAudio = useCallback((messageId?: string) => {
    if (!audioContextRef.current) return;

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