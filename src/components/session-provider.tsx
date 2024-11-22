'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import { AlertCircle, Loader2 } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

interface SessionProviderProps {
  userId: string
  sessionId: string
  route: string
  children: React.ReactNode
}

export function SessionProvider({ userId, sessionId, route, children }: SessionProviderProps) {
  const [sessionState, setSessionState] = useState<'loading' | 'exists' | 'not-found' | 'error'>('loading')

  useEffect(() => {
    const checkSession = async () => {
      try {
        await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}api/v1/sessions/check_session`, {
          params: { user_id: userId, session_id: sessionId }
        })
        setSessionState('exists')
      } catch (error: any) {
        if (error.response && error.response.status === 404) {
          setSessionState('not-found')
        } else {
          setSessionState('error')
        }
      }
    }

    checkSession()
  }, [userId, sessionId])

  if (sessionState === 'loading') {
    return (
      <Card className="w-[350px] mx-auto mt-8">
        <CardHeader>
          <CardTitle className="text-center">Checking Session</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
        <CardFooter>
          <p className="text-center w-full text-sm text-muted-foreground">Please wait while we verify your session...</p>
        </CardFooter>
      </Card>
    )
  }

  if (sessionState === 'not-found') {
    return (
      <Card className="w-[350px] mx-auto mt-8">
        <CardHeader>
          <CardTitle className="text-center">Session Not Found</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              We couldn&apos;t find your session. Please start a new one.
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button onClick={() => window.location.href = `${route}/session?username=${userId}`}>Start New Session</Button>
        </CardFooter>
      </Card>
    )
  }

  if (sessionState === 'error') {
    return (
      <Card className="w-[350px] mx-auto mt-8">
        <CardHeader>
          <CardTitle className="text-center">Error</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              An error occurred while checking your session. Please try again later.
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button onClick={() => window.location.href = '/'}>Go to Home</Button>
        </CardFooter>
      </Card>
    )
  }

  return <>{children}</>
}
