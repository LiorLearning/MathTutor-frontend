'use client'

import { useState, useEffect } from 'react'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { fetchQuestionBankContent, fetchAllGrades } from '@/actions/fetchContent'
import { QuestionBankContent } from '@/types/question-bank'

export function QuestionBankViewer() {
  const [content, setContent] = useState<QuestionBankContent[]>([])
  const [grades, setGrades] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const loadGrades = async () => {
      try {
        const data = await fetchAllGrades()
        setGrades(data)
      } catch (error) {
        console.error("Failed to fetch grades", error)
      }
    }
    loadGrades()
  }, [])

  const handleGradeChange = async (value: string) => {
    setLoading(true)
    try {
      const data = await fetchQuestionBankContent(value)
      setContent(data)
    } catch (error) {
      console.error("Failed to fetch question bank content", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-10 px-4 bg-background text-foreground">
      <div className="flex justify-center mb-6">
        <h1 className="text-2xl font-bold">Question Bank Content Viewer</h1>
      </div>
      <div className="flex justify-center mb-6">
        <Select onValueChange={handleGradeChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select grade" />
          </SelectTrigger>
          <SelectContent>
            {grades.map((grade) => (
              <SelectItem key={grade} value={grade}>Grade {grade}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-full">
          <div className="loader"></div>
          <span className="ml-2">Loading content...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {content.map((item) => (
            <Dialog key={item.content_id}>
              <DialogTrigger asChild>
                <Card className="w-full cursor-pointer hover:shadow-lg transition-shadow bg-card text-card-foreground">
                  <CardHeader>
                    <CardTitle>{item.content_title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{item.content_kind}</p>
                    <p className="text-sm text-muted-foreground">{item.standard_desc}</p>
                  </CardContent>
                </Card>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>{item.content_title}</DialogTitle>
                  <DialogDescription>
                    <p><strong>Content ID:</strong> {item.content_id}</p>
                    <p><strong>Set ID:</strong> {item.set_id}</p>
                    <p><strong>Standard ID:</strong> {item.standard_id}</p>
                    <p><strong>Standard Description:</strong> {item.standard_desc}</p>
                    <p><strong>Content Kind:</strong> {item.content_kind}</p>
                    <p><strong>Content URL:</strong> <a href={item.content_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{item.content_url}</a></p>
                    <p><strong>Grade:</strong> {item.grade}</p>
                    <p><strong>Created At:</strong> {new Date(item.created_at).toLocaleString()}</p>
                  </DialogDescription>
                </DialogHeader>
              </DialogContent>
            </Dialog>
          ))}
          {content.length === 0 && (
            <p className="text-center text-muted-foreground">No content available for the selected grade.</p>
          )}
        </div>
      )}
    </div>
  )
}
