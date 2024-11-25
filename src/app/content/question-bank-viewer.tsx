'use client'

import { useState, useEffect } from 'react'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ExternalLink } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { fetchQuestionBankContent, fetchAllGrades, fetchQuestionsByContentId } from '@/app/content/actions/fetchContent'
import { QuestionBankContent } from '@/types/question-bank'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

export function QuestionBankViewer() {
  const [content, setContent] = useState<QuestionBankContent[]>([])
  const [grades, setGrades] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [questions, setQuestions] = useState<{ [key: string]: any[] }>({})

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
    setSelectedGrade(value)
    setCurrentPage(1)
    await loadContent(value, 1, pageSize)
  }

  const handlePageSizeChange = async (value: string) => {
    const newSize = parseInt(value, 10)
    setPageSize(newSize)
    setCurrentPage(1)
    if (selectedGrade) {
      await loadContent(selectedGrade, 1, newSize)
    }
  }

  const loadContent = async (grade: string, page: number, size: number) => {
    setLoading(true)
    try {
      const data = await fetchQuestionBankContent(grade, (page - 1) * size, size)
      setContent(data)
    } catch (error) {
      console.error("Failed to fetch question bank content", error)
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (page: number) => {
    if (selectedGrade) {
      setCurrentPage(page)
      loadContent(selectedGrade, page, pageSize)
    }
  }

  const loadQuestions = async (contentId: string) => {
    if (!questions[contentId]) {
      try {
        const data = await fetchQuestionsByContentId(contentId)
        setQuestions(prev => ({ ...prev, [contentId]: data }))
      } catch (error) {
        console.error("Failed to fetch questions for the content", error)
      }
    }
  }

  return (
    <div className="container mx-auto py-10 px-4 bg-background text-foreground">
      <div className="flex justify-center mb-6">
        <h1 className="text-2xl font-bold">Question Bank Content Viewer</h1>
      </div>
      <div className="flex justify-between mb-6">
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
        <Select onValueChange={handlePageSizeChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select page size" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="20">20</SelectItem>
            <SelectItem value="50">50</SelectItem>
            <SelectItem value="100">100</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="loader"></div>
          <span className="ml-2">Loading content...</span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {content.map((item) => (
              <Dialog key={item.content_id} onOpenChange={() => loadQuestions(item.content_id)}>
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
                <DialogContent className="max-w-4xl sm:max-w-3xl">
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
                      <div>
                        <h2 className="text-xl font-bold mt-4">Questions</h2>
                        {questions[item.content_id] ? (
                          questions[item.content_id].map((question, index) => (
                            <div key={index} className="mt-2 flex items-center">
                              <p className="flex-grow"><strong>Description:</strong> {question.question_desc}</p>
                              <a href={`/content/question?id=${question.question_id}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline flex items-center">
                                <ExternalLink className="ml-1" size={16} />
                              </a>
                            </div>
                          ))
                        ) : (
                          <p>Loading questions...</p>
                        )}
                      </div>
                    </DialogDescription>
                  </DialogHeader>
                </DialogContent>
              </Dialog>
            ))}
          </div>
          {content.length === 0 && (
            <p className="text-center text-muted-foreground">No content available for the selected grade.</p>
          )}
          {content.length > 0 && (
            <div className="mt-6">
              <Pagination>
                <PaginationContent>
                  {currentPage !== 1 && (
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                      />
                    </PaginationItem>
                  )}
                  <PaginationItem>
                    {currentPage}
                  </PaginationItem>
                  {content.length === pageSize && (
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => handlePageChange(currentPage + 1)}
                      />
                    </PaginationItem>
                  )}
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </>
      )}
    </div>
  )
}
