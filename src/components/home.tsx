'use client'

import React, { useRef } from 'react';

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookOpen, Brain, Lightbulb, Puzzle, Smile, Mic } from "lucide-react"

export function HomePageComponent() {
  return (
    <div className="min-h-screen bg-blue-100 p-6">
      <header className="text-center mb-8">
        <h1 className="text-4xl font-bold text-blue-600 mb-2">Welcome to MathBuddy!</h1>
        <p className="text-xl text-blue-500">Your friendly AI math tutor</p>
      </header>

      <main>
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl text-blue-700">Start Learning</CardTitle>
            <CardDescription>Choose how you want to learn today!</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Button className="h-24 text-lg" variant="outline" onClick={() => window.location.href = '/chat'}>
              <BookOpen className="mr-2 h-6 w-6" /> Start a Lesson
            </Button>
            <Button className="h-24 text-lg" variant="outline">
              <Puzzle className="mr-2 h-6 w-6" /> Practice Problems
            </Button>
            <Button className="h-24 text-lg" variant="outline">
              <Smile className="mr-2 h-6 w-6" /> Fun Math Games
            </Button>
          </CardContent>
        </Card>

        <Tabs defaultValue="teaching" className="mb-8">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="teaching">Teaching</TabsTrigger>
            <TabsTrigger value="practice">Practice</TabsTrigger>
            <TabsTrigger value="interaction">Interaction</TabsTrigger>
          </TabsList>
          <TabsContent value="teaching">
            <Card>
              <CardHeader>
                <CardTitle>Teaching Elements</CardTitle>
                <CardDescription>How MathBuddy helps you learn</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center space-x-2">
                  <Lightbulb className="h-6 w-6 text-yellow-500" />
                  <span>Visual, manipulative-based learning</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Brain className="h-6 w-6 text-purple-500" />
                  <span>Personalized to your interests and abilities</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mic className="h-6 w-6 text-green-500" />
                  <span>Human-like voice interaction</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Puzzle className="h-6 w-6 text-red-500" />
                  <span>Concept teaching through interactive exercises</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="practice">
            <Card>
              <CardHeader>
                <CardTitle>Practice and Error Analysis</CardTitle>
                <CardDescription>Improve your skills with smart practice</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center space-x-2">
                  <Lightbulb className="h-6 w-6 text-yellow-500" />
                  <span>Socratic questioning for error analysis</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Brain className="h-6 w-6 text-purple-500" />
                  <span>Personalized practice problems</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mic className="h-6 w-6 text-green-500" />
                  <span>Voice-based problem solving</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Puzzle className="h-6 w-6 text-red-500" />
                  <span>Contextual hints and explanations</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="interaction">
            <Card>
              <CardHeader>
                <CardTitle>Fun Interactions</CardTitle>
                <CardDescription>MathBuddy is more than just a tutor</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center space-x-2">
                  <Smile className="h-6 w-6 text-yellow-500" />
                  <span>Chat about your interests</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Lightbulb className="h-6 w-6 text-purple-500" />
                  <span>Interest-based math jokes and riddles</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Brain className="h-6 w-6 text-green-500" />
                  <span>Explore math in your favorite topics</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mic className="h-6 w-6 text-red-500" />
                  <span>Voice chats and fun math games</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card>
          <CardHeader>
            <CardTitle>Your Learning Journey</CardTitle>
            <CardDescription>Track your progress and set goals</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-48 bg-blue-200 rounded-lg flex items-center justify-center">
              [Placeholder for progress chart or gamified learning path]
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}