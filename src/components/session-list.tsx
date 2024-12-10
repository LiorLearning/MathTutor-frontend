'use client'

import { Plus } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { MODEL_API_BASE_URL } from '@/components/utils/admin/admin_utils';
import { useSearchParams } from 'next/navigation';
import { useQuery } from 'react-query';
import axios from 'axios';

interface ChatSession {
  session_id: number;
  last_update_time: Date;
  summary?: string;
}

const fetchSessionsWithSummaries = async (username: string) => {
  try {
    const sessionsResponse = await axios.get<ChatSession[]>(`${MODEL_API_BASE_URL}/sessions/${username}`);
    const sessions = sessionsResponse.data;

    const summariesResponse = await axios.get<{ session_id: number, summary: string }[]>(`${MODEL_API_BASE_URL}/session_summary/${username}`);
    const summaries = summariesResponse.data;

    const sessionsWithSummaries = sessions.map((session) => {
      const summary = summaries.find((s) => s.session_id === session.session_id)?.summary || '';
      return { ...session, summary };
    });

    return sessionsWithSummaries;
  } catch (error) {
    console.error('Error fetching sessions or summaries:', error);
    throw new Error('Error fetching sessions or summaries');
  }
};

export default function SessionList({ is_admin }: { is_admin: boolean }) {
  const searchParams = useSearchParams();
  const username = searchParams?.get('username') || 'testuser';
  const baseRedirectUrl = is_admin 
    ? `/admin/interceptor?username=${username}`
    : `/chat?username=${username}`;

  const { data: sessions = [], isLoading, error } = useQuery(['sessions', username], () => fetchSessionsWithSummaries(username), {
    suspense: true,
  });

  const createNewSession = async () => {
    try {
      const response = await axios.post<number>(`${MODEL_API_BASE_URL}/sessions/${username}`);
      const newSessionId = response.data;
      const redirectUrl = baseRedirectUrl + `&session=${newSessionId}`;
      window.location.assign(redirectUrl);
    } catch (error) {
      console.error('Error creating new session:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="loader"></div>
        <span className="ml-2">Loading sessions...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-full text-red-500">
        <span>Error loading sessions. Please try again later.</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <div className="mb-4 p-4">
        <h2 className="text-xl">User ID: {username}</h2>
      </div>
      <Button onClick={createNewSession} className="w-full mb-4">
        <Plus className="mr-2 h-4 w-4" /> Create New Session
      </Button>
      <div className="space-y-4">
        {sessions.map((session) => (
          <Card 
            key={session.session_id} 
            onClick={() => {
              const redirectUrl = baseRedirectUrl + `&session=${session.session_id}`;
              window.location.assign(redirectUrl);
            }} 
            className="cursor-pointer shadow-md"
          >
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Session {session.session_id}</span>
                {is_admin && (
                  <div className="flex items-center">
                    <Button onClick={(e) => { 
                      e.stopPropagation(); 
                      window.location.assign(`/admin/summary?username=${username}&session=${session.session_id}`); 
                    }} className="ml-2">
                      Detailed Summary
                    </Button>
                  </div>
                )}
              </CardTitle>
              <CardDescription>
                Last updated: {new Date(session.last_update_time).toLocaleString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>{session.summary}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
