'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { FileIcon, Maximize2Icon } from 'lucide-react'

// Placeholder data
const users = [
  { id: '1', name: 'Alice' },
  { id: '2', name: 'Bob' },
  { id: '3', name: 'Charlie' },
]

const htmlFiles = {
  '1': [
    { id: '1', name: 'index.html', url: 'https://example.com/users/1/files/index.html' },
    { id: '2', name: 'about.html', url: 'https://example.com/users/1/files/about.html' },
  ],
  '2': [
    { id: '3', name: 'home.html', url: 'https://example.com/users/2/files/home.html' },
  ],
  '3': [
    { id: '4', name: 'portfolio.html', url: 'https://example.com/users/3/files/portfolio.html' },
    { id: '5', name: 'contact.html', url: 'https://example.com/users/3/files/contact.html' },
    { id: '6', name: 'projects.html', url: 'https://example.com/users/3/files/projects.html' },
  ],
}

export function HtmlFileViewer() {
  const [selectedUser, setSelectedUser] = useState<string | undefined>()

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">HTML File Viewer</h1>
      <Select onValueChange={setSelectedUser} value={selectedUser}>
        <SelectTrigger className="w-full mb-4">
          <SelectValue placeholder="Select a user" />
        </SelectTrigger>
        <SelectContent>
          {users.map((user) => (
            <SelectItem key={user.id} value={user.id}>
              {user.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {selectedUser && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {htmlFiles[selectedUser].map((file) => (
            <Card key={file.id} className="overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileIcon className="mr-2" />
                  {file.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" className="w-full p-0 h-auto hover:opacity-80 transition-opacity">
                      <Image
                        src={`/placeholder.svg?height=300&width=400&text=${encodeURIComponent(file.name)}`}
                        alt={`Preview of ${file.name}`}
                        width={400}
                        height={300}
                        className="w-full h-auto"
                      />
                      <span className="sr-only">View larger image of {file.name}</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl">
                    <DialogHeader>
                      <DialogTitle>{file.name}</DialogTitle>
                    </DialogHeader>
                    <Image
                      src={`/placeholder.svg?height=600&width=800&text=${encodeURIComponent(file.name)}`}
                      alt={`Large preview of ${file.name}`}
                      width={800}
                      height={600}
                      className="w-full h-auto"
                    />
                  </DialogContent>
                </Dialog>
              </CardContent>
              <CardFooter className="flex justify-between items-center">
                <Button asChild variant="ghost" size="sm">
                  <a href={file.url} target="_blank" rel="noopener noreferrer" className="flex items-center">
                    View HTML
                    <Maximize2Icon className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}