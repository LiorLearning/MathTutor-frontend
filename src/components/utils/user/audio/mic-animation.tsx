import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface MicAnimationProps {
  isRecording: boolean;
}

const MicAnimation: React.FC<MicAnimationProps> = ({ isRecording }) => {
  return (
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
  );
};

export default MicAnimation;
