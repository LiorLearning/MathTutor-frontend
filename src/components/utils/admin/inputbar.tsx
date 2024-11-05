import { Textarea } from '@/components/ui/textarea';
import React, { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button';
import { ImageIcon, Send, X, Loader } from 'lucide-react';
import axios from 'axios';

interface InputBarProps {
  onSendMessage: (message: string, images: string[]) => void
}

interface UploadFileResponse {
  filename: string;
  url: string;
}

interface UploadImagesResponse {
  uploaded_files: UploadFileResponse[];
}

function InputBar({ onSendMessage }: InputBarProps) {
  const [textInput, setTextInput] = useState("")
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textInputRef = useRef<HTMLTextAreaElement>(null)

  const handleTextareaInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = event.target;
    textarea.style.height = 'auto'; // Reset the height
    textarea.style.height = `${Math.min(textarea.scrollHeight, 10 * 24)}px`; // Set the height based on content, with a max of 10 rows (assuming 24px per row)
  };

  const handleFileUpload = async (files: File[]): Promise<string[]> => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    setIsUploading(true);
    try {
      const response = await axios.post<UploadImagesResponse>(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}api/v1/file/upload-images/`, 
        formData, {
          headers: {
            'accept': 'application/json',
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      return response.data.uploaded_files.map((file: UploadFileResponse) => file.url);
    } catch (error) {
      console.error('Error uploading images:', error);
      return [];
    } finally {
      setIsUploading(false);
    }
  }

  const handleTextSend = async () => {
    if (textInput.trim() === "" && selectedImages.length === 0) return; // Prevent sending empty messages

    let imageUrls: string[] = [];
    imageUrls = await handleFileUpload(selectedImages);

    onSendMessage(textInput, imageUrls);
    setTextInput("");
    clearImages();

    const textareaElement = document.querySelector(
      "textarea.textarea-send"
    ) as HTMLTextAreaElement;
    if (textareaElement) {
      textareaElement.style.height = "auto";
    }
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      addNewImages(newFiles)
    }
  }

  const addNewImages = (newFiles: File[]) => {
    setSelectedImages(prevImages => [...prevImages, ...newFiles])
    
    newFiles.forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrls(prevUrls => [...prevUrls, reader.result as string])
      }
      reader.readAsDataURL(file)
    })
  }

  const clearImages = () => {
    setSelectedImages([])
    setPreviewUrls([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeImage = (index: number) => {
    setSelectedImages(prevImages => prevImages.filter((_, i) => i !== index))
    setPreviewUrls(prevUrls => prevUrls.filter((_, i) => i !== index))
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

  return (
    <div className="relative w-full">
      {previewUrls.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2 items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {previewUrls.map((url, index) => (
              <div key={index} className="relative">
                <img
                  src={url}
                  alt={`Preview ${index + 1}`}
                  className="w-20 h-20 object-cover rounded-md"
                />
                <Button
                  size="icon"
                  variant="secondary"
                  onClick={() => removeImage(index)}
                  className="absolute top-0 right-0 bg-gray-800 text-white rounded-full p-1"
                  aria-label={`Remove image ${index + 1}`}
                >
                  <X size={16} />
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
            className="w-full h-12 text-black bg-gray-100 rounded-2xl px-4 py-3 pr-24 text-sm focus:outline-none focus:ring-2 focus:ring-gray-600 border border-gray-300 textarea-send"
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
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Upload images"
            >
              <ImageIcon size={20} />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={handleTextSend}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Send message"
            >
              {isUploading ? (
                <Loader size={20} className="animate-spin text-gray-400" />
              ) : (
                <Send size={20} />
              )}
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

export default InputBar;