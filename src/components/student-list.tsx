'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { User, Cake, GraduationCap, Search } from "lucide-react"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

// Mock data for students
const students = [
  { userName: "jsmith", firstName: "John", lastName: "Smith", age: 20, context: "Undergraduate" },
  { userName: "mjohnson", firstName: "Mary", lastName: "Johnson", age: 22, context: "Graduate" },
  { userName: "rwilliams", firstName: "Robert", lastName: "Williams", age: 19, context: "Undergraduate" },
  { userName: "ebrown", firstName: "Emily", lastName: "Brown", age: 21, context: "Undergraduate" },
  { userName: "djones", firstName: "David", lastName: "Jones", age: 23, context: "Graduate" },
]

export function StudentList() {
  const [searchTerm, setSearchTerm] = useState('')

  const handleCardClick = (userName: string) => {
    console.log(`Clicked on student: ${userName}`)
    // Here you would typically navigate to a detail page or open a modal
    // For example: router.push(`/students/${userName}`)
  }

  const filteredStudents = students.filter(student => 
    student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.userName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-5">Student List</h1>

      <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold">Manage Students</h2>
          <Link href="/admin-home">
            <Button variant="outline" className="flex items-center">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

      <div className="mb-6 relative">
        <Input
          type="text"
          placeholder="Search students..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      </div>
      <div className="space-y-4">
        {filteredStudents.map((student) => (
          <Card 
            key={student.userName} 
            className="w-full cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => handleCardClick(student.userName)}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {student.firstName} {student.lastName}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">@{student.userName}</p>
              <div className="flex items-center gap-2 text-sm">
                <Cake className="h-4 w-4" />
                <span>{student.age} years old</span>
              </div>
              <div className="flex items-center gap-2 text-sm mt-2">
                <GraduationCap className="h-4 w-4" />
                <span>{student.context}</span>
              </div>
            </CardContent>
          </Card>
        ))}
        {filteredStudents.length === 0 && (
          <p className="text-center text-muted-foreground">No students found matching your search.</p>
        )}
      </div>
    </div>
  )
}