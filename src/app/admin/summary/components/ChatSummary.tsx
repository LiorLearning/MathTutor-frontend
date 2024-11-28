'use client'

import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Star, RefreshCcw, Loader } from 'lucide-react'
import { Button } from "@/components/ui/button"

interface ChatIntervention {
  name: string
  count: number
  desc: string
}

interface ChatSummaryData {
  user_id: string
  session_id: number
  summary: string
  chat_interventions: ChatIntervention[]
  rating_learn: number
  rating_fun: number
  rating_comments: string
}

interface ChatSummaryProps {
  username: string;
  sessionId: string;
}

const fetchSessionSummary = async (username: string, sessionId: string) => {
  const response = await axios.get<ChatSummaryData>(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}api/v1/session_summary/${username}/${sessionId}`
  );
  return response.data;
}

export default function ChatSummary({ username, sessionId }: ChatSummaryProps) {
  const queryClient = useQueryClient()

  const { data: summaryData, isLoading, error } = useQuery<ChatSummaryData>(
    ['chatSummary', username, sessionId],
    () => fetchSessionSummary(username, sessionId)
  );

  const mutation = useMutation(
    async () => {
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}api/v1/session_summary/${username}/${sessionId}/summary`
      );
      return response.data;
    },
    {
      onSuccess: async () => {
        const data = await fetchSessionSummary(username, sessionId);
        queryClient.setQueryData(['chatSummary', username, sessionId], data);
      },
      onError: (error) => {
        console.error('Error updating chat summary:', error);
      }
    }
  );

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (error) {
    return <div>Error fetching chat summary</div>
  }

  const totalInterventions = summaryData?.chat_interventions.reduce((total, intervention) => total + intervention.count, 0) || 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Chat Summary</CardTitle>
          <Button 
            onClick={() => mutation.mutate()} 
            variant="ghost" 
            size="sm"
            className="h-8 w-8 p-0"
          >
            {mutation.isLoading ? (
              <Loader className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCcw className="h-4 w-4" />
            )}
            <span className="sr-only">Refresh summary</span>
          </Button>
        </CardHeader>
        <CardContent>
          <p>{summaryData?.summary}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Interventions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Count</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summaryData?.chat_interventions.map((intervention, index) => (
                <TableRow key={index}>
                  <TableCell>{intervention.name}</TableCell>
                  <TableCell>{intervention.count}</TableCell>
                  <TableCell>{intervention.desc}</TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell>Total</TableCell>
                <TableCell>{totalInterventions}</TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ratings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <p className="font-semibold">Learning:</p>
              {[...Array(5)].map((_, index) => (
                <Star
                  key={index}
                  className={`h-5 w-5 ${index < (summaryData?.rating_learn || 0) ? 'text-yellow-500' : 'text-gray-300'}`}
                />
              ))}
            </div>
            <div className="flex items-center space-x-4">
              <p className="font-semibold">Fun:</p>
              {[...Array(5)].map((_, index) => (
                <Star
                  key={index}
                  className={`h-5 w-5 ${index < (summaryData?.rating_fun || 0) ? 'text-yellow-500' : 'text-gray-300'}`}
                />
              ))}
            </div>
            <div className="mt-4">
              <p className="font-semibold">Comments:</p>
              <p className="p-2 rounded-md">{summaryData?.rating_comments}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
