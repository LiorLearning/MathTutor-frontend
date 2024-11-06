import React, { useState, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Square, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SpeechToTextProps {
  onRecordingStart: () => void;
  onRecordingStop: (blob: Blob) => void;
}

const SpeechToText: React.FC<SpeechToTextProps> = ({ onRecordingStart, onRecordingStop }) => {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      onRecordingStart();
    } catch (err) {
      console.error('Error accessing microphone:', err);
    }
  };

  const stopRecording = () => {
    if (isRecording && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        audioChunksRef.current = [];
        onRecordingStop(audioBlob);

        mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
      };
    }
  };

  return (
    <div className="relative flex flex-col items-center">
      <AnimatePresence>
        {isRecording ? (
          <motion.div
            key="recording"
            className="absolute -top-16"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            <div className="flex space-x-1">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-1 bg-primary dark:bg-primary-foreground rounded-full"
                  animate={{
                    height: [8, 32, 16, 24, 8],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    repeatType: "reverse",
                    ease: "easeInOut",
                    delay: i * 0.2,
                  }}
                />
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="not-recording"
            className="absolute -top-12"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <motion.div
              className="w-4 h-4 bg-muted-foreground dark:bg-muted rounded-full"
              animate={{
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-center w-full">
        <Button
          onClick={isRecording ? stopRecording : startRecording}
          className={`w-full h-12 rounded-full flex items-center justify-center transition-colors ${
            isRecording ? "bg-destructive hover:bg-destructive/90 dark:bg-destructive dark:hover:bg-destructive/90" : "bg-primary hover:bg-primary/90 dark:bg-primary dark:hover:bg-primary/90"
          }`}
          aria-label={isRecording ? "Stop recording" : "Start recording"}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={isRecording ? "stop" : "start"}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.2 }}
            >
              {isRecording ? (
                <Square className="w-8 h-8 text-destructive-foreground dark:text-destructive-foreground" />
              ) : (
                <Mic className="w-8 h-8 text-primary-foreground dark:text-primary-foreground" />
              )}
            </motion.div>
          </AnimatePresence>
        </Button>
      </div>
    </div>
  );
};

export default SpeechToText;