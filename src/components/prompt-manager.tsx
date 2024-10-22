'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast, useToast } from "@/hooks/use-toast"
import { ChevronDown, ChevronUp, Trash2, Pencil } from 'lucide-react'
import axios from 'axios'
import { Prompt, MODEL_API_BASE_URL } from '@/components/utils/admin_utils'
import { useFormState } from 'react-dom'

interface NewPrompt {
  name: string;
  desc: string;
  content: string;
}

const emptyPrompt = {
  id: '',
  name: '',
  desc: '',
  content: '',
  created_at: ''
}

export function PromptManagerComponent() {
  const [promptNames, setPromptNames] = useState<string[]>([])
  const [selectedName, setSelectedName] = useState<string>('')
  const [prompt, setPrompt] = useState<Prompt>(emptyPrompt);
  const [promptInput, setPromptInput] = useState<string>('');
  const [allPrompts, setAllPrompts] = useState<Prompt[]>([]);
  const [newPrompt, setNewPrompt] = useState<NewPrompt>({ name: '', content: '' , desc: ''})
  const [expandedPrompts, setExpandedPrompts] = useState<boolean>(false);
  const { toast } = useToast()

  useEffect(() => {
    fetchPromptNames()
  }, [])

  useEffect(() => {
    if (selectedName) {
      fetchLatestPromptByName(selectedName)
    }
  }, [selectedName])

  const fetchPromptNames = async () => {
    try {
      const response = await axios.get<string[]>(`${MODEL_API_BASE_URL}/prompts/names/`)
      setPromptNames(response.data)
    } catch (error) {
      toast({ title: "Error", description: "Failed to fetch prompt names", variant: "destructive" })
    }
  }

  const fetchLatestPromptByName = async (name: string) => {
    try {
      const response = await axios.get<Prompt>(`${MODEL_API_BASE_URL}/prompts/${name}`)
      setPrompt(response.data)
      setPromptInput(response.data.content)
    } catch (error) {
      toast({ title: "Error", description: "Failed to fetch latest prompt", variant: "destructive" })
    }
  }

  const handleCreatePrompt = async () => {
    try {
      const response = await axios.post<Prompt>(`${MODEL_API_BASE_URL}/prompts/`, newPrompt)
      setPrompt(response.data)
      setNewPrompt({ name: '', content: '', desc: ''})
      toast({ title: "Success", description: "Prompt created successfully" })
      fetchPromptNames()
    } catch (error) {
      toast({ title: "Error", description: "Failed to create prompt", variant: "destructive" })
    }
  }

  const handleUpdatePrompt = async (inputContent: string) => {
    try {
      const response = await axios.post<Prompt>(`${MODEL_API_BASE_URL}/prompts/update/${prompt.name}`, {
        "name": prompt.name,
        "desc": prompt.desc,
        "content": inputContent,
      })
      setPrompt(response.data);
      toast({ title: "Success", description: "Prompt updated successfully" })
    } catch (error) {
      toast({ title: "Error", description: "Failed to update prompt", variant: "destructive" })
    }
  }

  const fetchAllPromptsByName = async (name: string) => {
    try {
      const response = await axios.get<Prompt[]>(`${MODEL_API_BASE_URL}/prompts/all/${name}`)
      setAllPrompts(response.data)
    } catch (error) {
      toast({ title: "Error", description: "Failed to fetch all prompts", variant: "destructive" })
    }
  }

  const handleDeletePrompt = async (id: string) => {
    try {
      await axios.delete(`${MODEL_API_BASE_URL}/prompts/${id}`)
      setPrompt(emptyPrompt)
      toast({ title: "Success", description: "Prompt deleted successfully" })
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete prompt", variant: "destructive" })
    }
  }

  const handleDeleteAllPrompts = async (name: string) => {
    try {
      await axios.delete(`${MODEL_API_BASE_URL}/prompts/name/${name}`)
      setPrompt(emptyPrompt)
      toast({ title: "Success", description: "All prompts with the selected name deleted successfully" })
      fetchPromptNames()
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete prompts", variant: "destructive" })
    }
  }

  const toggleExpandPrompts = () => {
    setExpandedPrompts(!expandedPrompts);
    if (expandedPrompts) {
      setAllPrompts([]);
    } else {
      fetchAllPromptsByName(selectedName);
    }
  }

  return (
    <div className="container mx-auto p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="col-span-1">
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Create New Prompt</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Input
                placeholder="Prompt Name"
                value={newPrompt.name}
                onChange={(e) => setNewPrompt({ ...newPrompt, name: e.target.value })}
              />
              <Input
                placeholder="Prompt Description"
                value={newPrompt.desc}
                onChange={(e) => setNewPrompt({ ...newPrompt, desc: e.target.value })}
              />
              <Textarea
                placeholder="Prompt Content"
                value={newPrompt.content}
                onChange={(e) => setNewPrompt({ ...newPrompt, content: e.target.value })}
                style={{ height: '200px' }} // Increased default height
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleCreatePrompt}>Create Prompt</Button>
          </CardFooter>
        </Card>
      </div>

      <div className="col-span-3">
        <Card>
          <CardHeader>
            <CardTitle>Manage Prompts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Select onValueChange={setSelectedName}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a prompt name" />
                </SelectTrigger>
                <SelectContent>
                  {promptNames.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedName && (
                <div className="flex justify-between items-center">
                  <Button variant="destructive" onClick={() => handleDeleteAllPrompts(selectedName)}>
                    Delete All Prompts with Selected Name
                  </Button>
                  <Button onClick={toggleExpandPrompts}>
                    {expandedPrompts ? <ChevronUp className="mr-2" /> : <ChevronDown className="mr-2" />}
                    {expandedPrompts ? 'Collapse' : 'Expand'} Past Prompts
                  </Button>
                </div>
              )}
            </div>
            {selectedName && (
              <Card key={prompt.id} className="mt-4">
                <CardContent className="pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-500">Created: {new Date(prompt.created_at).toLocaleString()}</span>
                    <div className="flex space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleUpdatePrompt(promptInput)} 
                        disabled={prompt.content === promptInput}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeletePrompt(prompt.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <Textarea
                    value={promptInput}
                    onChange={(e) => setPromptInput(e.target.value)}
                    style={{ height: '400px' }} // Size to match content
                  />
                </CardContent>
              </Card>
            )}
            
            {expandedPrompts && allPrompts.map((prompt) => (
              <Card key={prompt.id} className="mt-4">
                <CardContent className="pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-500">Created: {new Date(prompt.created_at).toLocaleString()}</span>
                    <Button variant="ghost" size="sm" onClick={() => handleDeletePrompt(prompt.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <span className="text-sm text-gray-500 mb-2">{prompt.desc}</span>
                  <Textarea
                    value={prompt.content}
                    onChange={(e) => {
                      const updatedPrompt = { ...prompt, content: e.target.value }
                      setPrompt(updatedPrompt)
                    }}
                    style={{ height: '300px' }}
                  />
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}