'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarPlus, Users } from "lucide-react"

export function AdminPageComponent() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <main className="flex-grow container mx-auto py-8 px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="bg-card text-card-foreground">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <Button className="bg-primary hover:bg-primary-600 text-primary-foreground">
                  <CalendarPlus className="mr-2 h-4 w-4" />
                  Schedule Class
                </Button>
                <Button className="bg-primary hover:bg-primary-600 text-primary-foreground" onClick={() => window.location.assign('/admin/all-students')}>
                  <Users className="mr-2 h-4 w-4" />
                  Manage Students
                </Button>
                <Button className="bg-primary hover:bg-primary-600 text-primary-foreground" onClick={() => window.location.assign('/admin/prompt')}>
                  <Users className="mr-2 h-4 w-4" />
                  Manage Prompts
                </Button>
                <Button className="bg-primary hover:bg-primary-600 text-primary-foreground" onClick={() => window.location.assign('/admin/artifacts')}>
                  <Users className="mr-2 h-4 w-4" />
                  Artifacts
                </Button>
                <Button className="bg-primary hover:bg-primary-600 text-primary-foreground" onClick={() => window.location.assign('/content')}>
                  <Users className="mr-2 h-4 w-4" />
                  Question Bank
                </Button>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card text-card-foreground">
            <CardHeader>
              <CardTitle>Key Data</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Students</p>
                  <p className="text-2xl font-bold">1,234</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Classes Today</p>
                  <p className="text-2xl font-bold">15</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Classes This Week</p>
                  <p className="text-2xl font-bold">87</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">New Students (This Week)</p>
                  <p className="text-2xl font-bold">23</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8 bg-card text-card-foreground">
          <CardHeader>
            <CardTitle>Upcoming Classes</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full">
              <thead>
                <tr className="text-left">
                  <th className="pb-2">Student</th>
                  <th className="pb-2">Grade</th>
                  <th className="pb-2">Topic</th>
                  <th className="pb-2">Date & Time</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-2">Alex Thompson</td>
                  <td>4th</td>
                  <td>Multiplication</td>
                  <td>Today, 3:00 PM</td>
                </tr>
                <tr>
                  <td className="py-2">Sophia Lee</td>
                  <td>7th</td>
                  <td>Algebra Basics</td>
                  <td>Tomorrow, 10:00 AM</td>
                </tr>
                <tr>
                  <td className="py-2">Ethan Brown</td>
                  <td>2nd</td>
                  <td>Addition & Subtraction</td>
                  <td>May 15, 2:30 PM</td>
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card className="bg-card text-card-foreground">
          <CardHeader>
            <CardTitle>Past Classes</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full">
              <thead>
                <tr className="text-left">
                  <th className="pb-2">Student</th>
                  <th className="pb-2">Grade</th>
                  <th className="pb-2">Topic</th>
                  <th className="pb-2">Date & Time</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-2">Emma Wilson</td>
                  <td>6th</td>
                  <td>Fractions</td>
                  <td>Yesterday, 2:00 PM</td>
                </tr>
                <tr>
                  <td className="py-2">Liam Garcia</td>
                  <td>3rd</td>
                  <td>Basic Division</td>
                  <td>May 10, 11:00 AM</td>
                </tr>
                <tr>
                  <td className="py-2">Olivia Chen</td>
                  <td>5th</td>
                  <td>Decimals</td>
                  <td>May 9, 4:00 PM</td>
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>
      </main>

      <footer className="bg-muted text-muted-foreground py-4 px-6 text-center text-sm">
        © 2023 MathMentor AI. All rights reserved.
      </footer>
    </div>
  )
}