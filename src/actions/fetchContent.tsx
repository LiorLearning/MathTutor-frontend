'use server'

import axios from 'axios'
import { QuestionBankContent } from "@/types/question-bank"
import { MODEL_API_BASE_URL } from '@/components/utils/admin/admin_utils'


export async function fetchQuestionBankContent(grade: string): Promise<QuestionBankContent[]> {
  try {
    const response = await axios.get<QuestionBankContent[]>(`${MODEL_API_BASE_URL}/content/grade/${grade}`)
    return response.data
  } catch (error) {
    console.error("Failed to fetch question bank content", error)
    throw new Error("Failed to fetch question bank content")
  }
}

export async function fetchAllGrades(): Promise<string[]> {
  try {
    const response = await axios.get<string[]>(`${MODEL_API_BASE_URL}/content/grades/`)
    return response.data
  } catch (error) {
    console.error("Failed to fetch grades", error)
    throw new Error("Failed to fetch grades")
  }
}
