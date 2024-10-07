'use client'

import React, { useState, useRef, useEffect, ReactElement } from 'react'
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Send, Mic } from "lucide-react"

class Message {
  constructor(public id: number, public text: string, public sender: 'user' | 'bot') {}
}

const initialMessages = [
  new Message(1, "Welcome to the interactive lesson!", "bot"),
  new Message(2, "Let's start with the basics of variables.", "bot"),
  new Message(3, "What is a variable?", "user"),
  new Message(4, "A variable is a quantity that can change, often represented by a letter.", "bot"),
]

export function Chat() {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [isListening, setIsListening] = useState(false)
  const [inputText, setInputText] = useState("")
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const lastBotMessageRef = useRef<HTMLDivElement>(null)

  const toggleListening = () => {
    setIsListening(!isListening)
    // Here you would typically start/stop actual voice recognition
  }

  useEffect(() => {
    if (lastBotMessageRef.current) {
      lastBotMessageRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const handleSendMessage = () => {
    if (inputText.trim() === "") return

    const newUserMessage = new Message(messages.length + 1, inputText, "user")

    setMessages(prevMessages => [...prevMessages, newUserMessage])
    setInputText("")

    // Simulate bot response after a short delay
    setTimeout(() => {
      const newBotMessage = new Message(messages.length + 2, "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam auctor, nisl nec ultricies ultricies, nunc nisl aliquam nunc, vitae aliquam nisl nunc vitae nisl.", "bot")
      setMessages(prevMessages => [...prevMessages, newBotMessage])
    }, 1000)
  }

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto bg-white">
      <header className="p-4 border-b">
        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
          <div className="bg-blue-600 h-2.5 rounded-full w-1/2"></div>
        </div>
        <h1 className="text-xl font-bold">MathTutor</h1>
      </header>
      
      <ScrollArea className="flex-grow p-4" ref={scrollAreaRef}>
        <div className="space-y-6">
          {messages.map((message, index) => (
            <div 
              key={message.id} 
              className="flex flex-col items-center"
              ref={index === messages.length - 1 && message.sender === 'bot' ? lastBotMessageRef : null}
            >
              <div className={`max-w-[80%] ${message.sender === 'user' ? 'self-end' : 'self-start'}`}>
                <div
                  className={`rounded-2xl p-4 ${
                    message.sender === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-800'
                  } ${message.sender === 'bot' && index < messages.length - 1 ? 'opacity-50' : ''} 
                  ${message.sender === 'bot' && index === messages.length - 1 ? 'opacity-100' : ''}`}
                >
                  {message.text}
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
      
      <div className="p-6 border-t flex items-center">
        <Input 
          className="flex-grow mr-2 h-12"
          placeholder="Type your message..." 
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleSendMessage()
            }
          }}
        />
        <Button 
          size="icon" 
          className={`mr-2 transition-all duration-1000 ease-in-out w-24 h-12 ${
            isListening 
              ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
              : 'bg-blue-500 hover:bg-blue-600'
          }`}
          onClick={toggleListening}
        >
          <Mic className="h-5 w-5" /> {/* Increased icon size */}
        </Button>
        <Button size="icon" className={`h-12 w-12`} onClick={handleSendMessage}>
          <Send className="h-5 w-5" /> {/* Increased icon size */}
        </Button>
      </div>
    </div>
  )
}