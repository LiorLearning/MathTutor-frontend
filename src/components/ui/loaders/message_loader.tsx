'use client'

import { motion } from 'framer-motion'
import React from 'react';

const MessageLoader: React.FC = () => {
  return (
    <div className="flex items-center justify-center h-8 w-full">
      <div className="flex space-x-1">
        {[0, 1, 2].map((index) => (
          <motion.div
            key={index}
            className="w-2 h-2 bg-primary dark:bg-primary rounded-full"
            initial={{ opacity: 0.2 }}
            animate={{ opacity: 1 }}
            transition={{
              repeat: Infinity,
              repeatType: 'reverse',
              duration: 0.8,
              delay: index * 0.2,
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default MessageLoader;