'use client'

import { Plus } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { MODEL_API_BASE_URL } from '@/components/utils/admin/admin_utils';
import { useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import { useState } from 'react';

interface ChatSession {
  session_id: number;
  last_update_time: Date;
  summary: string;
}

interface UpdateSessionResponse {
  updated_summary: string;
}

const fetchSessions = async (username: string) => {
  try {
    const response = await axios.get<ChatSession[]>(`${MODEL_API_BASE_URL}/sessions/${username}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching sessions:', error);
    throw new Error('Error fetching sessions');
  }
};

const updateSessionSummary = async ({ username, sessionId }: { username: string, sessionId: number }) => {
  try {
    const response = await axios.put<UpdateSessionResponse>(`${MODEL_API_BASE_URL}/sessions/${username}/${sessionId}/summary`);
    return response.data.updated_summary;
  } catch (error) {
    console.error('Error updating session summary:', error);
    throw new Error('Error updating session summary');
  }
};

export default function SessionList() {
  const searchParams = useSearchParams();
  const username = searchParams.get('username') || 'testuser';
  const queryClient = useQueryClient();
  const [updatingSessionId, setUpdatingSessionId] = useState<number | null>(null);

  const { data: sessions = [], isLoading, error } = useQuery(['sessions', username], () => fetchSessions(username), {
    suspense: true,
  });

  const mutation = useMutation(updateSessionSummary, {
    onSuccess: (updatedSummary, { sessionId }) => {
      console.log('Mutation successful, updated summary:', updatedSummary);
      queryClient.setQueryData(['sessions', username], (oldData: ChatSession[] | undefined) => {
        if (!oldData) return [];
        return oldData.map(session => 
          session.session_id === sessionId ? { ...session, summary: updatedSummary } : session
        );
      });
      setUpdatingSessionId(null);
    },
    onError: (error) => {
      console.error('Mutation failed:', error);
      setUpdatingSessionId(null);
    },
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

  const handleUpdateSummary = (sessionId: number) => {
    setUpdatingSessionId(sessionId);
    mutation.mutate({ username, sessionId });
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
                {updatingSessionId === session.session_id ? (
                  <div className="flex items-center">
                    <span className="ml-2">Updating summary...</span>
                  </div>
                ) : (
                  <Button onClick={(e) => { e.stopPropagation(); handleUpdateSummary(session.session_id); }} className="ml-2">
                    Update Summary
                  </Button>
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
