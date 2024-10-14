'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useSearchParams } from 'next/navigation'
import { CalendarPlus, MessageCircle, ArrowLeft } from "lucide-react"
import Link from "next/link"

export function ManageStudentsComponent() {
  const searchParams = useSearchParams();
  const username = searchParams.get('username') || 'testuser';

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold">Manage Students</h2>
          <Link href="/admin/all-students">
            <Button variant="outline" className="flex items-center">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Students List
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Student Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><strong>Name:</strong> Alex Thompson</p>
                <p><strong>Grade:</strong> 4th</p>
                <p><strong>Age:</strong> 9</p>
                <p><strong>Parent/Guardian:</strong> Sarah Thompson</p>
                <p><strong>Email:</strong> sarah.thompson@example.com</p>
                <p><strong>Phone:</strong> (555) 123-4567</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-4 w-3/5 mx-auto">
                <Link href={`/admin/schedule?username=${username}`}>
                  <Button className="bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center w-full">
                    <CalendarPlus className="mr-2 h-4 w-4" />
                    Schedule New Class
                  </Button>
                </Link>
                <Link href={`/admin/interceptor?username=${username}`}>
                  <Button className="bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center w-full">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Go to Interceptor Page
                  </Button>
                </Link>
                <Link href={`/chat?username=${username}`}>
                  <Button className="bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center w-full">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Go to Chat Page
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>User context</CardTitle>
          </CardHeader>
          <CardContent>
            <p>This section provides an overview of the user context, including the student's current status, recent activities, and any important notes for the teacher or guardian. It is essential to keep this information updated to ensure effective communication and support for the student's learning journey.</p>
          </CardContent>
        </Card>

        <Card className="mb-8">
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
                    <Button className="bg-blue-500 hover:bg-blue-600 text-white" size="sm">Reschedule</Button>
                  </td>
                </tr>
                <tr>
                  <td className="py-2">Division Basics</td>
                  <td>May 18, 4:00 PM</td>
                  <td>45 minutes</td>
                  <td>
                    <Button className="bg-blue-500 hover:bg-blue-600 text-white" size="sm">Reschedule</Button>
                  </td>
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card>
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