'use client'

import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

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



export default function ChatSummary({ username, sessionId }: ChatSummaryProps) {
  const [summaryData, setSummaryData] = useState<ChatSummaryData | null>(null)

  const fetchSummary = useCallback(async () => {
    try {
      const response = await axios.get<ChatSummaryData>(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}api/v1/session_summary/${username}/${sessionId}`
      );
      setSummaryData(response.data);
    } catch (error) {
      console.error('Error fetching chat summary:', error);
    }
  }, [username, sessionId]);

  useEffect(() => {
    fetchSummary()
  }, [fetchSummary])

  if (!summaryData) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Chat Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{summaryData.summary}</p>
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
              {summaryData.chat_interventions.map((intervention, index) => (
                <TableRow key={index}>
                  <TableCell>{intervention.name}</TableCell>
                  <TableCell>{intervention.count}</TableCell>
                  <TableCell>{intervention.desc}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ratings</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Learning: {summaryData.rating_learn}/5</p>
          <p>Fun: {summaryData.rating_fun}/5</p>
          <p>Comments: {summaryData.rating_comments}</p>
        </CardContent>
      </Card>
    </div>
  )
}
