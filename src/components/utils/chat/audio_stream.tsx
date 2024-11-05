import React, { useState, useEffect, useCallback, useRef, createContext, ReactNode } from 'react';

interface AudioContextProps {
  isConnected: boolean;
  audioContextRef: React.MutableRefObject<AudioContext | null>;
  scheduledAudioRef: React.MutableRefObject<Record<string, { source: AudioBufferSourceNode; gain: GainNode; startTime: number; }[]>>;
  nextStartTimeRef: React.MutableRefObject<Record<string, number>>;
  isFirstChunkRef: React.MutableRefObject<Record<string, boolean>>;
  audioBufferQueueRef: React.MutableRefObject<Record<string, Float32Array[]>>;
  webSocketRef: React.MutableRefObject<WebSocket | null>; // Added webSocketRef
  playAudio: (messageId: string, text: string) => void;
  stopAudio: (messageId?: string) => void;
  setIsPlaying: (messageId: string, isPlaying: boolean) => void; // Added setIsPlaying
}

export const AudioContext = createContext<AudioContextProps | null>(null);

interface AudioProviderProps {
  children: ReactNode;
  clientId: string;
  setIsPlaying: (messageId: string, isPlaying: boolean) => void; // Added setIsPlaying
}

export const AudioProvider: React.FC<AudioProviderProps> = ({ children, clientId, setIsPlaying }) => {
  const [isConnected, setIsConnected] = useState(false);

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

  const playAudio = useCallback((messageId: string, text: string) => {
    console.log(`Attempting to play audio for messageId: ${messageId}`);
    
    // Connect websocket and wait for it to be ready
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

  }, [setIsPlaying]);

  const stopAudio = useCallback((messageId?: string) => {
    console.log(`Stopping audio for messageId: ${messageId}`);
    if (!audioContextRef.current) {
      console.warn('Audio context not available, cannot stop audio.');
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
      // Stop all scheduled audio sources
      if (scheduledAudioRef.current[id]) {
        console.log(`Stopping scheduled audio for messageId: ${id}`);
        scheduledAudioRef.current[id].forEach(({ source, gain }) => {
          try {
            // Apply quick fade out to avoid clicks
            gain.gain.cancelScheduledValues(currentTime);
            gain.gain.setValueAtTime(gain.gain.value, currentTime);
            gain.gain.linearRampToValueAtTime(0, currentTime + 0.05);

            // Schedule the source to stop shortly after the fade
            setTimeout(() => {
              try {
                source.stop();
                source.disconnect();
                gain.disconnect();
                console.log(`Audio stopped for messageId: ${id}`);
              } catch (e) {
                console.error(`Error stopping audio for messageId: ${id}`, e);
              }
            }, 60);
          } catch (e) {
            console.error(`Error during fade out for messageId: ${id}`, e);
          }
        });

        // Clean up references
        delete scheduledAudioRef.current[id];
        delete nextStartTimeRef.current[id];
        delete isFirstChunkRef.current[id];
        delete audioBufferQueueRef.current[id];
      }
    });

    // If no specific messageId was provided, reset the current message
    if (!messageId) {
      console.log('Resetting current message audio.');
    } else {
      setIsPlaying(messageId, false); // Call setIsPlaying when audio stops
    }
  }, [setIsPlaying]);

  const processAudioQueue = useCallback((messageId: string) => {
    console.log(`Processing audio queue for messageId: ${messageId}`);
    if (!audioContextRef.current || !audioBufferQueueRef.current[messageId]) {
      console.warn(`Audio context not available or no audio buffer for messageId: ${messageId}`);
      return;
    }

    const queue = audioBufferQueueRef.current[messageId];
    if (!queue.length) {
      console.log(`No audio data in queue for messageId: ${messageId}`);
      return;
    }

    // Calculate total buffered duration, including currently playing audio
    const scheduledDuration = (scheduledAudioRef.current[messageId] || [])
      .reduce((acc, { source }) => acc + (source.buffer?.duration || 0), 0);
    const queuedDuration = queue.reduce((acc, chunk) => acc + (chunk.length / 24000), 0);
    const totalBufferedDuration = scheduledDuration + queuedDuration;

    // Start processing if we have enough buffer
    if (totalBufferedDuration >= MIN_BUFFER_DURATION || (queue.length >= BUFFER_SIZE_THRESHOLD)) {
      console.log(`Starting audio playback for messageId: ${messageId}, totalBufferedDuration: ${totalBufferedDuration}`);
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
        console.log(`Audio started for messageId: ${messageId} at time: ${startTime}`);

        if (!scheduledAudioRef.current[messageId]) {
          scheduledAudioRef.current[messageId] = [];
        }
        scheduledAudioRef.current[messageId].push({ source, gain: gainNode, startTime });

        nextStartTimeRef.current[messageId] = startTime + audioBuffer.duration;
      }
    } else {
      console.log(`Not enough buffer to start playback for messageId: ${messageId}`);
    }
  }, []);

  const connectWebSocket = useCallback((messageId: string) => {
    console.log(`Connecting WebSocket for messageId: ${messageId}`);
    if (webSocketRef.current) {
      webSocketRef.current.close();
    }

    webSocketRef.current = new WebSocket(`${process.env.NEXT_PUBLIC_WS_BASE_URL}/cartesia/${messageId}/ws`);

    webSocketRef.current.onopen = () => {
      console.log('WebSocket connection opened');
      setIsConnected(true);
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    };

    webSocketRef.current.onclose = () => {
      console.log('WebSocket connection closed');
      setIsConnected(false);
    };

    webSocketRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };

    webSocketRef.current.onmessage = async (event) => {
      console.log('WebSocket message received');
      if (event.data instanceof Blob) {
        const arrayBuffer = await event.data.arrayBuffer();
        const audioData = new Float32Array(arrayBuffer);

        // Initialize queue if needed
        if (!audioBufferQueueRef.current[messageId]) {
          audioBufferQueueRef.current[messageId] = [];
        }

        // Add to queue
        audioBufferQueueRef.current[messageId].push(audioData);
        console.log(`Audio data added to queue for messageId: ${messageId}`);

        // Process queue
        processAudioQueue(messageId);
      } else {
        try {
          const data = JSON.parse(event.data);
          console.log(`Parsed message data:`, data);

          if (data.type === 'stream_start') {
            console.log(`Stream started for messageId: ${data.messageId}`);
            isFirstChunkRef.current[data.messageId] = true;
            audioBufferQueueRef.current[data.messageId] = [];
          } else if (data.type === 'stream_end') {
            console.log(`Stream ended for messageId: ${data.messageId}`);
            // Process any remaining audio in the queue
            processAudioQueue(data.messageId);

            // Wait for a short time to ensure all chunks are processed
            await new Promise(resolve => setTimeout(resolve, 100));

            // Apply fade out to the last scheduled audio chunk
            const audioChunks = scheduledAudioRef.current[data.messageId];
            if (audioChunks && audioChunks.length > 0) {
              const lastChunk = audioChunks[audioChunks.length - 1];
              const endTime = lastChunk.startTime + (lastChunk.source.buffer?.duration || 0);
              lastChunk.gain.gain.setValueAtTime(1, endTime - FADE_OUT_DURATION);
              lastChunk.gain.gain.linearRampToValueAtTime(0, endTime);
              console.log(`Fade out applied to last chunk for messageId: ${data.messageId}`);
            }

            // Close the WebSocket connection
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
          // Add a small buffer time to ensure the audio has actually finished
          if (currentTime > startTime + (source.buffer?.duration || 0) + 0.1) {
            try {
              gain.disconnect();
              source.disconnect();
              console.log(`Finished audio cleaned up for messageId: ${messageId}`);
            } catch (e) {
              console.error(`Error during cleanup for messageId: ${messageId}`, e);
            }
          }
          return false;
        }
        return true;
      });

      // Clean up empty message arrays
      if (scheduledAudioRef.current[messageId].length === 0) {
        delete scheduledAudioRef.current[messageId];
        delete nextStartTimeRef.current[messageId];
        delete audioBufferQueueRef.current[messageId];
        console.log(`Cleaned up empty audio data for messageId: ${messageId}`);
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
        audioContextRef,
        scheduledAudioRef,
        nextStartTimeRef,
        isFirstChunkRef,
        audioBufferQueueRef,
        webSocketRef,
        playAudio,
        stopAudio,
        setIsPlaying, // Provide setIsPlaying to context
      }}
    >
      {children}
    </AudioContext.Provider>
  );
};