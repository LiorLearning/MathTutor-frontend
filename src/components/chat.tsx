"use client"

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Mic, Volume2, Star, Zap, Trophy, BarChart, Sparkles, Send } from "lucide-react"

const companionEmotions = [
  { emotion: "happy", emoji: "😊" },
  { emotion: "excited", emoji: "🤩" },
  { emotion: "thinking", emoji: "🤔" },
  { emotion: "surprised", emoji: "😲" },
]

export function Chat() {
  const [isListening, setIsListening] = useState(false)
  const [currentEmotion, setCurrentEmotion] = useState(companionEmotions[0])
  const [spokenText, setSpokenText] = useState("")
  const [funFact, setFunFact] = useState("Did you know that one day on Venus is longer than one year on Venus? Venus rotates so slowly that it takes 243 Earth days to complete one rotation!")
  const [chatMessages, setChatMessages] = useState([
    { sender: 'bot', message: "Hi there! What would you like to learn about today?" },
  ])

  const handleMicClick = () => {
    setIsListening(!isListening)
    setCurrentEmotion(companionEmotions[1]) // excited
    if (!isListening) {
      // Simulating speech recognition
      setTimeout(() => {
        const newMessage = "Tell me about the solar system"
        setSpokenText(newMessage)
        setChatMessages([...chatMessages, { sender: 'user', message: newMessage }])
        setIsListening(false)
        setCurrentEmotion(companionEmotions[2]) // thinking
        // Update fun fact when speech is recognized
        setFunFact("The solar system consists of the Sun and everything that orbits around it, including 8 planets, dwarf planets, and countless smaller objects like asteroids and comets!")
        // Simulate bot response
        setTimeout(() => {
          setChatMessages(prev => [...prev, { sender: 'bot', message: "The solar system is fascinating! It includes our Sun, eight planets, dwarf planets, moons, asteroids, and comets. What specific part would you like to know more about?" }])
        }, 1000)
      }, 3000)
    } else {
      setSpokenText("")
    }
  }

  return (
    <div className="flex h-screen bg-white">
      {/* Progress Panel */}
      <div className="w-1/4 bg-blue-50 p-8 border-r border-blue-200">
        <h2 className="text-2xl font-bold text-blue-600 mb-6">Your Progress</h2>
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <Zap className="w-5 h-5 text-yellow-500 mr-2" />
                <span className="font-semibold text-blue-800">Streak</span>
              </div>
              <span className="text-2xl font-bold text-blue-600">7 days</span>
            </div>
            <div className="bg-blue-100 h-2 rounded-full">
              <div className="bg-yellow-500 h-2 rounded-full" style={{width: '70%'}}></div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <Star className="w-5 h-5 text-yellow-500 mr-2" />
                <span className="font-semibold text-blue-800">XP Points</span>
              </div>
              <span className="text-2xl font-bold text-blue-600">1,234</span>
            </div>
            <div className="bg-blue-100 h-2 rounded-full">
              <div className="bg-yellow-500 h-2 rounded-full" style={{width: '60%'}}></div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <Trophy className="w-5 h-5 text-yellow-500 mr-2" />
                <span className="font-semibold text-blue-800">Achievements</span>
              </div>
              <span className="text-2xl font-bold text-blue-600">8/20</span>
            </div>
            <div className="bg-blue-100 h-2 rounded-full">
              <div className="bg-yellow-500 h-2 rounded-full" style={{width: '40%'}}></div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <BarChart className="w-5 h-5 text-blue-500 mr-2" />
                <span className="font-semibold text-blue-800">Topics Mastered</span>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <div className="bg-blue-200 h-16 rounded-lg"></div>
              <div className="bg-blue-300 h-12 rounded-lg"></div>
              <div className="bg-blue-400 h-20 rounded-lg"></div>
              <div className="bg-blue-500 h-8 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Companion View */}
      <div className="w-1/2 bg-white p-8 flex flex-col">
        <div className="flex-grow flex flex-col items-center justify-center">
          <div className="w-64 h-64 bg-blue-200 rounded-full mb-8 flex items-center justify-center relative">
            <div className="text-8xl">{currentEmotion.emoji}</div>
            {isListening && (
              <div className="absolute inset-0 rounded-full border-4 border-blue-500 animate-pulse"></div>
            )}
          </div>
          <div className="bg-blue-50 p-6 rounded-2xl shadow-lg max-w-md w-full mb-8">
            <div className="flex items-center mb-4">
              <Sparkles className="w-6 h-6 text-yellow-400 mr-2" />
              <h2 className="text-xl font-bold text-blue-600">Fun Fact!</h2>
            </div>
            <p className="text-blue-800">{funFact}</p>
          </div>
        </div>
        <div className="mt-auto">
          <div className="bg-blue-50 p-4 rounded-2xl shadow-lg w-full max-w-md mx-auto mb-4">
            <p className="text-blue-800 text-center text-lg font-semibold">
              {spokenText || "Tap the microphone and start speaking!"}
            </p>
          </div>
          <Button 
            className={`w-full max-w-md mx-auto h-16 rounded-full ${isListening ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'} text-white text-xl font-bold transition-colors duration-300`} 
            size="lg"
            onClick={handleMicClick}
          >
            {isListening ? (
              <>
                <Volume2 className="w-8 h-8 mr-2 animate-pulse" />
                Listening...
              </>
            ) : (
              <>
                <Mic className="w-8 h-8 mr-2" />
                Tap to Speak
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Chat Window */}
      <div className="w-1/4 bg-blue-50 p-4 flex flex-col">
        <div className="flex-grow overflow-auto mb-4 bg-white rounded-lg shadow-inner p-4">
          {chatMessages.map((msg, index) => (
            <div key={index} className={`mb-4 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
              <div className={`inline-block p-3 rounded-lg ${msg.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-blue-800'}`}>
                {msg.message}
              </div>
            </div>
          ))}
        </div>
        <div className="flex">
          <Input 
            className="flex-grow mr-2 rounded-full border-2 border-blue-200 focus:border-blue-400"
            placeholder="Type your message..."
          />
          <Button className="rounded-full bg-blue-500 hover:bg-blue-600 text-white" size="icon">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}