'use server'

import axios from 'axios'
import { Question } from "@/types/question-bank"
import { MODEL_API_BASE_URL } from '@/components/utils/admin/admin_utils'

export async function fetchQuestionById(questionId: string): Promise<Question> {
  try {
    const response = await axios.get<Question>(`${MODEL_API_BASE_URL}/question/${questionId}`, {
      headers: {
        'accept': 'application/json'
      }
    })
    return response.data
  } catch (error) {
    console.error("Failed to fetch question by ID", error)
    throw new Error("Failed to fetch question by ID")
  }
}
