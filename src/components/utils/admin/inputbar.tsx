'use client'

import { Textarea } from '@/components/ui/textarea'
import React, { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { ImageIcon, Send, X, Loader, Upload, Check } from 'lucide-react'
import axios from 'axios'

interface InputBarProps {
  onSendMessage: (message: string, images: string[]) => void
}

interface UploadFileResponse {
  filename: string
  url: string
}

interface UploadImagesResponse {
  uploaded_files: UploadFileResponse[]
}

interface ImageFile {
  file: File
  previewUrl: string
  uploaded: boolean
  url?: string
  isUploading: boolean
}

export default function InputBar({ onSendMessage }: InputBarProps) {
  const [textInput, setTextInput] = useState("")
  const [selectedImages, setSelectedImages] = useState<ImageFile[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textInputRef = useRef<HTMLTextAreaElement>(null)

  const handleTextareaInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = event.target
    textarea.style.height = 'auto'
    textarea.style.height = `${Math.min(textarea.scrollHeight, 10 * 24)}px`
  }

  const handleFileUpload = async (file: File, index: number): Promise<string | null> => {
    const formData = new FormData()
    formData.append('files', file)

    try {
      const response = await axios.post<UploadImagesResponse>(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}api/v1/file/upload-images/`, 
        formData, 
        {
          headers: {
            'accept': 'application/json',
            'Content-Type': 'multipart/form-data'
          }
        }
      )
      return response.data.uploaded_files[0].url
    } catch (error) {
      console.error('Error uploading image:', error)
      return null
    } finally {
      setSelectedImages(prevImages => 
        prevImages.map((img, i) => 
          i === index ? { ...img, isUploading: false } : img
        )
      )
    }
  }

  const handleTextSend = async () => {
    if (textInput.trim() === "" && selectedImages.length === 0) return

    const imageUrls: string[] = []

    for (let index = 0; index < selectedImages.length; index++) {
      const image = selectedImages[index];
      if (!image.uploaded) {
        setSelectedImages(prevImages => 
          prevImages.map((img, i) => 
            i === index ? { ...img, isUploading: true } : img
          )
        )
        const url = await handleFileUpload(image.file, index)
        if (url) {
          imageUrls.push(url)
        }
      } else if (image.url) {
        imageUrls.push(image.url)
      }
    }

    onSendMessage(textInput, imageUrls)
    setTextInput("")
    setSelectedImages([])

    const textareaElement = document.querySelector(
      "textarea.textarea-send"
    ) as HTMLTextAreaElement
    if (textareaElement) {
      textareaElement.style.height = "auto"
    }
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      addNewImages(newFiles)
    }
  }

  const addNewImages = (newFiles: File[]) => {
    const newImageFiles: ImageFile[] = newFiles.map(file => ({
      file,
      previewUrl: URL.createObjectURL(file),
      uploaded: false,
      isUploading: false
    }))
    setSelectedImages(prevImages => [...prevImages, ...newImageFiles])
  }

  const clearImages = () => {
    setSelectedImages([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeImage = (index: number) => {
    setSelectedImages(prevImages => prevImages.filter((_, i) => i !== index))
  }

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData.items
    const imageFiles: File[] = []

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile()
        if (file) {
          imageFiles.push(file)
        }
      }
    }

    if (imageFiles.length > 0) {
      e.preventDefault()
      addNewImages(imageFiles)
    }
  }, [])

  const handleUploadImage = async (index: number) => {
    const image = selectedImages[index]
    if (!image.uploaded) {
      setSelectedImages(prevImages => 
        prevImages.map((img, i) => 
          i === index ? { ...img, isUploading: true } : img
        )
      )
      const url = await handleFileUpload(image.file, index)
      if (url) {
        setSelectedImages(prevImages => 
          prevImages.map((img, i) => 
            i === index ? { ...img, uploaded: true, url } : img
          )
        )
      }
    }
  }

  return (
    <div className="relative w-full">
      {selectedImages.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2 items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {selectedImages.map((image, index) => (
              <div key={index} className="relative">
                <img
                  src={image.previewUrl}
                  alt={`Preview ${index + 1}`}
                  className={`w-20 h-20 object-cover rounded-md ${image.isUploading ? 'opacity-50' : ''}`}
                />
                {image.isUploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 rounded-md">
                    <Loader size={20} className="animate-spin text-white" />
                  </div>
                )}
                <Button
                  size="icon"
                  variant="secondary"
                  onClick={() => removeImage(index)}
                  className="absolute top-0 right-0 bg-gray-800 text-white rounded-full p-1"
                  aria-label={`Remove image ${index + 1}`}
                >
                  <X size={16} />
                </Button>
                <Button
                  size="icon"
                  variant="secondary"
                  onClick={() => handleUploadImage(index)}
                  className="absolute bottom-0 right-0 bg-gray-800 text-white rounded-full p-1"
                  aria-label={`Upload image ${index + 1}`}
                  disabled={image.uploaded || image.isUploading}
                >
                  {image.uploaded ? <Check size={16} /> : <Upload size={16} />}
                </Button>
              </div>
            ))}
          </div>
          <Button
            size="sm"
            variant="destructive"
            onClick={clearImages}
            className="bg-red-600 text-white rounded-md p-2"
            aria-label="Clear all images"
          >
            <X size={16} />
          </Button>
        </div>
      )}
      <div className="flex items-center space-x-2">
        <div className="relative flex-grow">
          <Textarea
            ref={textInputRef}
            value={textInput}
            onChange={(e) => {
              setTextInput(e.target.value)
              handleTextareaInput(e)
            }}
            onPaste={handlePaste}
            placeholder="Type a message or paste an image"
            className="w-full h-12 text-foreground bg-background rounded-2xl px-4 py-3 pr-24 text-sm focus:outline-none focus:ring-2 focus:ring-ring border border-border textarea-send"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleTextSend()
              }
            }}
            rows={1}
            style={{ maxHeight: '240px' }}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => fileInputRef.current?.click()}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Upload images"
            >
              <ImageIcon size={20} />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={handleTextSend}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Send message"
            >
              <Send size={20} />
            </Button>
          </div>
        </div>
      </div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageSelect}
        accept="image/*"
        multiple
        className="hidden"
      />
    </div>
  )
}