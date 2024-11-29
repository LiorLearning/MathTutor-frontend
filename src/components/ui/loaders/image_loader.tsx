'use client'

import { motion } from 'framer-motion'
import React from 'react'

export default function Component() {
  const text = "Generating image..."
  
  return (
    <div className="flex items-center justify-center h-8 w-full">
      <div className="p-4">
        <div className="flex items-center space-x-2">
          <div className="flex">
            {text.split("").map((char, index) => (
              <motion.span
                key={index}
                className="text-sm font-semibold text-card-foreground dark:text-card-foreground"
                initial={{ opacity: 0.2 }}
                animate={{ opacity: 1 }}
                transition={{
                  repeat: Infinity,
                  repeatType: 'reverse',
                  duration: 1.5,
                  delay: index * 0.05,
                }}
              >
                {char === " " ? "\u00A0" : char}
              </motion.span>
            ))}
          </div>
          <div className="flex space-x-1">
            {[0, 1, 2].map((index) => (
              <motion.div
                key={index}
                className="w-1.5 h-1.5 bg-primary dark:bg-primary rounded-full"
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
    </div>
  )
}