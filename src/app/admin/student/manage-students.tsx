'use client'

import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useSearchParams } from 'next/navigation'
import { CalendarPlus, MessageCircle, ArrowLeft } from "lucide-react"
import Link from "next/link"
import axios from 'axios';
import { Student, MODEL_API_BASE_URL } from '@/components/utils/admin/admin_utils';

export function ManageStudentsComponent() {
  const searchParams = useSearchParams();
  const username = searchParams.get('username') || 'testuser';
  const [studentDetails, setStudentDetails] = useState<Student | null>(null);

  useEffect(() => {
    const fetchStudentDetails = async () => {
      try {
        const response = await axios.get<Student>(`${MODEL_API_BASE_URL}/users/${username}`);
        setStudentDetails(response.data);
      } catch (error) {
        console.error('Error fetching student details:', error);
      }
    };

    fetchStudentDetails();
  }, [username]);

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground dark:bg-background dark:text-foreground">
      <main className="flex-grow container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-primary-foreground dark:text-primary-foreground">Manage Students</h2>
          <Link href="/admin/all-students">
            <Button variant="outline" className="flex items-center bg-muted text-muted-foreground dark:bg-muted dark:text-muted-foreground">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Students List
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="bg-card text-card-foreground dark:bg-card dark:text-card-foreground">
            <CardHeader>
              <CardTitle>Student Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {studentDetails ? (
                  <>
                    <p><strong>Name:</strong> {studentDetails.first_name} {studentDetails.last_name}</p>
                    <p><strong>Grade:</strong> {studentDetails.grade}</p>
                    <p><strong>Age:</strong> {studentDetails.age}</p>
                    <p><strong>Parent/Guardian:</strong> {studentDetails.parent_guardian}</p>
                    <p><strong>Email:</strong> {studentDetails.email}</p>
                    <p><strong>Phone:</strong> {studentDetails.phone}</p>
                  </>
                ) : (
                  <p>Loading student details...</p>
                )}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card text-card-foreground dark:bg-card dark:text-card-foreground">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-4 w-3/5 mx-auto">
                <Link href={`/admin/schedule?username=${username}`}>
                  <Button className="bg-primary text-primary-foreground dark:bg-primary dark:text-primary-foreground flex items-center justify-center w-full">
                    <CalendarPlus className="mr-2 h-4 w-4" />
                    Schedule New Class
                  </Button>
                </Link>
                <Link href={`/admin/interceptor?username=${username}`}>
                  <Button className="bg-primary text-primary-foreground dark:bg-primary dark:text-primary-foreground flex items-center justify-center w-full">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Go to Interceptor Page
                  </Button>
                </Link>
                <Link href={`/chat/session?username=${username}`}>
                  <Button className="bg-primary text-primary-foreground dark:bg-primary dark:text-primary-foreground flex items-center justify-center w-full">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Go to Sessions Page
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8 bg-card text-card-foreground dark:bg-card dark:text-card-foreground">
          <CardHeader>
            <CardTitle>User context</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{studentDetails?.user_context}</p>
          </CardContent>
        </Card>

        <Card className="mb-8 bg-card text-card-foreground dark:bg-card dark:text-card-foreground">
          <CardHeader>
            <CardTitle>Upcoming Classes</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full">
              <thead>
                <tr className="text-left">
                  <th className="pb-2">Topic</th>
                  <th className="pb-2">Date & Time</th>
                  <th className="pb-2">Duration</th>
                  <th className="pb-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-2">Multiplication</td>
                  <td>May 15, 3:00 PM</td>
                  <td>45 minutes</td>
                  <td>
                    <Button className="bg-primary text-primary-foreground dark:bg-primary dark:text-primary-foreground" size="sm">Reschedule</Button>
                  </td>
                </tr>
                <tr>
                  <td className="py-2">Division Basics</td>
                  <td>May 18, 4:00 PM</td>
                  <td>45 minutes</td>
                  <td>
                    <Button className="bg-primary text-primary-foreground dark:bg-primary dark:text-primary-foreground" size="sm">Reschedule</Button>
                  </td>
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card className="bg-card text-card-foreground dark:bg-card dark:text-card-foreground">
          <CardHeader>
            <CardTitle>Past Classes</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full">
              <thead>
                <tr className="text-left">
                  <th className="pb-2">Topic</th>
                  <th className="pb-2">Date & Time</th>
                  <th className="pb-2">Duration</th>
                  <th className="pb-2">Summary</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-2">Addition & Subtraction</td>
                  <td>May 5, 2:00 PM</td>
                  <td>45 minutes</td>
                  <td>Student demonstrated a strong understanding of basic operations.</td>
                </tr>
                <tr>
                  <td className="py-2">Fractions Introduction</td>
                  <td>May 8, 3:30 PM</td>
                  <td>45 minutes</td>
                  <td>Student grasped the concept but needs more practice.</td>
                </tr>
                <tr>
                  <td className="py-2">Place Values</td>
                  <td>May 10, 4:00 PM</td>
                  <td>45 minutes</td>
                  <td>Student showed good comprehension of place value concepts.</td>
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}