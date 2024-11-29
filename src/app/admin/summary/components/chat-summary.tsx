'use client'

import axios from 'axios'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Star, RefreshCcw, Loader, Save } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Textarea } from '@/components/ui/textarea'

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

interface SuccessResponse {
  message: string;
  updated_summary: ChatSummaryData
}

const fetchSessionSummary = async (username: string, sessionId: string) => {
  const response = await axios.get<ChatSummaryData>(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}api/v1/session_summary/${username}/${sessionId}`
  );
  return response.data;
}

export default function ChatSummary({ username, sessionId }: ChatSummaryProps) {
  const queryClient = useQueryClient()
  const [ratingLearn, setRatingLearn] = useState<number>(0)
  const [ratingFun, setRatingFun] = useState<number>(0)
  const [ratingComments, setRatingComments] = useState<string>("")
  const [isSaveEnabled, setIsSaveEnabled] = useState<boolean>(false)

  const { data: summaryData, isLoading, error } = useQuery<ChatSummaryData>(
    ['chatSummary', username, sessionId],
    () => fetchSessionSummary(username, sessionId),
    {
      onSuccess: (data) => {
        setRatingLearn(data.rating_learn)
        setRatingFun(data.rating_fun)
        setRatingComments(data.rating_comments)
      }
    }
  );

  useEffect(() => {
    if (summaryData) {
      const isDifferent = 
        ratingLearn !== summaryData.rating_learn ||
        ratingFun !== summaryData.rating_fun ||
        ratingComments !== summaryData.rating_comments
      setIsSaveEnabled(isDifferent)
    }
  }, [ratingLearn, ratingFun, ratingComments, summaryData])

  const summaryMutation = useMutation(
    async () => {
      const response = await axios.put<SuccessResponse>(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}api/v1/session_summary/${username}/${sessionId}/summary`
      );
      return response.data;
    },
    {
      onSuccess: (data) => {
        queryClient.setQueryData(['chatSummary', username, sessionId], data.updated_summary);
      },
      onError: (error) => {
        console.error('Error updating chat summary:', error);
      }
    }
  );

  const interventionsMutation = useMutation(
    async () => {
      const response = await axios.put<SuccessResponse>(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}api/v1/session_summary/${username}/${sessionId}/count_interventions`
      );
      return response.data;
    },
    {
      onSuccess: (data) => {
        queryClient.setQueryData(['chatSummary', username, sessionId], data.updated_summary);
      },
      onError: (error) => {
        console.error('Error updating intervention counts:', error);
      }
    }
  );

  const ratingsMutation = useMutation(
    async () => {
      const response = await axios.put<SuccessResponse>(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}api/v1/session_summary/${username}/${sessionId}/ratings`,
        {
          rating_learn: ratingLearn,
          rating_fun: ratingFun,
          rating_comments: ratingComments
        }
      );
      return response.data;
    },
    {
      onSuccess: (data) => {
        queryClient.setQueryData(['chatSummary', username, sessionId], data.updated_summary);
      },
      onError: (error) => {
        console.error('Error updating ratings:', error);
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
          <div className="flex space-x-2">
            <Button 
              onClick={() => summaryMutation.mutate()} 
              variant="ghost" 
              size="sm"
              className="h-8 w-8 p-0"
            >
              {summaryMutation.isLoading ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCcw className="h-4 w-4" />
              )}
              <span className="sr-only">Refresh summary</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p>{summaryData?.summary}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Interventions</CardTitle>
          <div className="flex space-x-2">
            <Button 
              onClick={() => interventionsMutation.mutate()} 
              variant="ghost" 
              size="sm"
              className="h-8 w-8 p-0"
            >
              {interventionsMutation.isLoading ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCcw className="h-4 w-4" />
              )}
              <span className="sr-only">Update interventions</span>
            </Button>
          </div>
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
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Ratings</CardTitle>
          <div className="flex space-x-2">
            <Button 
              onClick={() => ratingsMutation.mutate()} 
              variant="ghost" 
              size="sm"
              className="h-8 w-8 p-0"
              disabled={!isSaveEnabled}
            >
              {ratingsMutation.isLoading ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span className="sr-only">Save ratings</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <p className="font-semibold">Learning:</p>
              {[...Array(5)].map((_, index) => (
                <Star
                  key={index}
                  className={`h-5 w-5 ${index < ratingLearn ? 'text-yellow-500 fill-current' : 'text-gray-300'}`}
                  onClick={() => setRatingLearn(index + 1)}
                />
              ))}
            </div>
            <div className="flex items-center space-x-4">
              <p className="font-semibold">Fun:</p>
              {[...Array(5)].map((_, index) => (
                <Star
                  key={index}
                  className={`h-5 w-5 ${index < ratingFun ? 'text-yellow-500 fill-current' : 'text-gray-300'}`}
                  onClick={() => setRatingFun(index + 1)}
                />
              ))}
            </div>
            <div className="mt-4">
              <p className="font-semibold">Comments:</p>
              <Textarea 
                className="p-2 rounded-md" 
                value={ratingComments} 
                onChange={(e) => setRatingComments(e.target.value)} 
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
