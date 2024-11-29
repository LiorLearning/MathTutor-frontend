'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { PlayIcon, PauseIcon } from 'lucide-react'

interface AudioFile {
  name: string;
  url: string;
  voice_id: string;
}

export const audioFiles: AudioFile[] = [
  { name: "Jessica", url: "https://mathtutor-images.s3.us-east-1.amazonaws.com/audio/jessica.mp3", voice_id: "cgSgspJ2msm6clMCkdW9" },
  { name: "Matilda", url: "https://mathtutor-images.s3.us-east-1.amazonaws.com/audio/matilda.mp3", voice_id: "XrExE9yKIg1WjnnlVkGX" },
  { name: "Dorothy", url: "https://mathtutor-images.s3.us-east-1.amazonaws.com/audio/dorothy.mp3", voice_id: "ThT5KcBeYPX3keUQqHPh" },
  { name: "Chris", url: "https://mathtutor-images.s3.us-east-1.amazonaws.com/audio/chris.mp3", voice_id: "iP95p4xoKVk53GoZ742B" },
  { name: "Charlie", url: "https://mathtutor-images.s3.us-east-1.amazonaws.com/audio/charlie.mp3", voice_id: "IKne3meq5aSn9XLyUdCD" },
]

export const audioFileMap: { [key: string]: AudioFile } = audioFiles.reduce((map: { [key: string]: AudioFile }, audio) => {
  map[audio.name] = audio;
  return map;
}, {} as { [key: string]: AudioFile });

export default function AudioSelector() {
  const [selectedAudio, setSelectedAudio] = useState<AudioFile>(audioFiles[0])
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    const savedAudioName = localStorage.getItem('selectedAudio')
    if (savedAudioName && audioFileMap[savedAudioName]) {
      setSelectedAudio(audioFileMap[savedAudioName])
    }
  }, [])

  const handleAudioChange = (value: string) => {
    const selected = audioFiles.find(audio => audio.url === value)
    if (selected) {
      setSelectedAudio(selected)
      setIsPlaying(false)
      localStorage.setItem('selectedAudio', selected.name)
    }
  }

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  return (
    <div>
      <div className="flex items-center space-x-2">
        <Select onValueChange={handleAudioChange} value={selectedAudio ? selectedAudio.url : ''}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select an audio file" />
          </SelectTrigger>
          <SelectContent>
            {audioFiles.map((audio) => (
              <SelectItem key={audio.url} value={audio.url}>
                {audio.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={togglePlayPause} variant="outline" size="icon">
          {isPlaying ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}
        </Button>
      </div>

      <audio
        ref={audioRef}
        src={selectedAudio ? selectedAudio.url : ''}
        onEnded={() => setIsPlaying(false)}
        className="w-full"
        style={{ display: 'none' }}
      />
    </div>
  )
}
