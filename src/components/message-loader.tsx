"use client"

import React from 'react'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, Calculator, Zap, Stars } from 'lucide-react'

export function MessageLoader() {
  const [messageIndex, setMessageIndex] = useState(0)
  const messages = [
    { text: "Thinking", icon: Brain, color: "text-blue-500" },
    { text: "Calculating", icon: Calculator, color: "text-green-500" },
    { text: "Processing", icon: Zap, color: "text-yellow-500" },
    { text: "Evaluating", icon: Stars, color: "text-purple-500" }
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prevIndex) => (prevIndex + 1) % messages.length)
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <motion.div
        className="relative w-16 h-16"
        animate={{ rotate: 360 }}
        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
      >
        {[0, 1, 2, 3].map((index) => (
          <motion.div
            key={index}
            className="absolute w-full h-full"
            style={{
              border: '2px solid',
              borderRadius: '50%',
              borderColor: `${['#60A5FA', '#34D399', '#FBBF24', '#A78BFA'][index]} transparent transparent transparent`,
              animation: `spin ${1.2 + index}s linear infinite`,
            }}
          />
        ))}
      </motion.div>
      
      <AnimatePresence mode="wait">
        <motion.div
          key={messageIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="flex items-center ml-2 text-center"
        >
          <motion.div
            className="text-3xl mb-1"
            animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 0.6 }}
          >
            {React.createElement(messages[messageIndex].icon, { className: `inline ${messages[messageIndex].color}`, size: 36 })}
          </motion.div>
          <h2 className={`text-xl font-bold ${messages[messageIndex].color} ml-2`}>
            {messages[messageIndex].text}
          </h2>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}