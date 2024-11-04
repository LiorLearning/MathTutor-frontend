import React from 'react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

interface PopupProps {
  handleEnterClass: () => void;
}

const Popup: React.FC<PopupProps> = ({ handleEnterClass }) => {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="absolute inset-0 flex items-center justify-center bg-black/50 z-50"
      >
        <motion.div
          className="bg-card p-8 rounded-lg shadow-lg w-full max-w-md"
          initial={{ y: -50 }}
          animate={{ y: 0 }}
        >
          <h2 className="text-2xl font-bold mb-4">Welcome to MathTutor</h2>
          <Button onClick={handleEnterClass} className="w-full">
            Enter Class
          </Button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default Popup;