'use client'

import { useState } from 'react';
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
  summary: string;
}

const fetchSessions = async (username: string) => {
  const response = await axios.get<ChatSession[]>(`${MODEL_API_BASE_URL}/sessions/${username}`);
  return response.data;
};

export default function SessionList() {
  const searchParams = useSearchParams();
  const username = searchParams.get('username') || 'testuser';

  const { data: sessions = [], isLoading, error } = useQuery(['sessions', username], () => fetchSessions(username), {
    suspense: true,
  });

  const createNewSession = async () => {
    try {
      const response = await axios.post<number>(`${MODEL_API_BASE_URL}/sessions/${username}`);
      const newSessionId = response.data;
      window.location.assign(`/chat?username=${username}&session=${newSessionId}`);
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
            onClick={() => window.location.assign(
              `/chat?username=${username}&session=${session.session_id}`
            )} 
            className="cursor-pointer shadow-md"
          >
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Session {session.session_id}</span>
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
