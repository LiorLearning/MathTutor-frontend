import React, { useState, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Mic, X, Send } from 'lucide-react';
import { Button } from "@/components/ui/button";
import MicAnimation from './mic-animation';
import { ANDROID_PHONE, IPHONE } from '../../common_utils';

interface SpeechToTextProps {
  onRecordingStart: () => void;
  onRecordingStop: (blob: Blob) => void;
  deviceType: string;
}

const SpeechToText: React.FC<SpeechToTextProps> = ({ onRecordingStart, onRecordingStop, deviceType }) => {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const isPhone = deviceType === ANDROID_PHONE || deviceType === IPHONE;

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
        video: false
      });

      const mimeType = [
        'audio/webm',
        'audio/mp4',
        'audio/mpeg',
        'audio/ogg',
        'audio/wav'
      ].find(type => MediaRecorder.isTypeSupported(type)) || '';

      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: mimeType,
        audioBitsPerSecond: 128000
      });

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.start(100);
      setIsRecording(true);
      onRecordingStart();
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('Unable to access the microphone. Please ensure you have granted the necessary permissions and are using a supported browser.');
    }
  };

  const stopRecording = (shouldSave: boolean) => {
    if (isRecording && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      mediaRecorderRef.current.onstop = () => {
        if (shouldSave) {
          const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
          onRecordingStop(audioBlob);
        }
        
        audioChunksRef.current = [];

        if (mediaRecorderRef.current?.stream) {
          mediaRecorderRef.current.stream.getTracks().forEach(track => {
            track.stop();
            mediaRecorderRef.current?.stream.removeTrack(track);
          });
        }
      };
    }
  };

  return (
    <div className="relative flex flex-col items-center">
      <MicAnimation isRecording={isRecording}/>
      <div className="flex justify-center w-full space-x-2">
        <AnimatePresence mode="wait">
          {isRecording ? (
            <>
              <motion.div
                key="cancel-recording"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.3 }}
                className="w-1/2"
              >
                <Button
                  onClick={() => stopRecording(false)}
                  className="w-full h-12 rounded-full flex items-center justify-center bg-destructive hover:bg-destructive/90 dark:bg-destructive dark:hover:bg-destructive/90"
                  aria-label="Cancel recording"
                >
                  <X className="w-6 h-6 text-destructive-foreground dark:text-destructive-foreground" />
                </Button>
              </motion.div>
              <motion.div
                key="stop-recording"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.3 }}
                className="w-1/2"
              >
                <Button
                  onClick={() => stopRecording(true)}
                  className="w-full h-12 rounded-full flex items-center justify-center bg-primary hover:bg-primary/90 dark:bg-primary dark:hover:bg-primary/90"
                  aria-label="Stop recording"
                >
                  <Send className="w-6 h-6 text-primary-foreground dark:text-primary-foreground" />
                </Button>
              </motion.div>
            </>
          ) : (
            <motion.div
              key="start-recording"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            >
              <Button
                onClick={startRecording}
                className="w-full h-12 rounded-full flex items-center justify-center bg-primary hover:bg-primary/90 dark:bg-primary dark:hover:bg-primary/90"
                aria-label="Start recording"
              >
                <Mic className="w-6 h-6 text-primary-foreground dark:text-primary-foreground" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SpeechToText;

