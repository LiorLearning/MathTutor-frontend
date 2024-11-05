'use client'

import { motion } from 'framer-motion'
import React from 'react';

const MessageLoader: React.FC = () => {
  return (
    <div className="flex items-center justify-center h-12 w-full">
      <div className="bg-white p-6 rounded-lg">
        <div className="flex space-x-2">
          {[0, 1, 2].map((index) => (
            <motion.div
              key={index}
              className="w-3 h-3 bg-blue-500 rounded-full"
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
    </div>
  );
};

export default MessageLoader;