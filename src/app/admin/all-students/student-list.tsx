'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { User, Cake, Search, ArrowLeft, Expand } from 'lucide-react'
import { Button } from "@/components/ui/button"
import Link from "next/link"
import axios from 'axios'
import { Student, MODEL_API_BASE_URL } from '@/components/utils/admin/admin_utils'
import { useQuery } from 'react-query'
import { StudentDialog } from './student-dialog'

const fetchStudents = async () => {
  try {
    const response = await axios.get<Student[]>(`${MODEL_API_BASE_URL}/users/`);
    return response.data;
  } catch (error) {
    throw new Error('Error fetching students');
  }
};

export function StudentList() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)

  const { data: students = [], isLoading, error } = useQuery('students', fetchStudents, {
    suspense: false,
    staleTime: 30000,
  });

  const filteredStudents = students.filter(student => 
    student.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.userid.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="loader"></div>
        <span className="ml-2">Loading students...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-full text-red-500">
        <span>Error loading students. Please try again later.</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4 bg-background text-foreground">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold mb-5">Student List</h1>
        <Link href="/admin">
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
          className="pl-10 bg-input text-foreground"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStudents.map((student, index) => (
          <Card 
            key={`${student.userid}-${index}`} 
            className="w-full cursor-pointer hover:shadow-lg transition-shadow bg-card text-card-foreground"
            onClick={() => window.location.assign(`/admin/student?username=${student.userid}`)}
          >
            <CardHeader className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {student.first_name} {student.last_name}
              </CardTitle>
            </CardHeader>
            <CardContent className="relative">
              <div>
                <p className="text-sm text-muted-foreground mb-2">@{student.userid}</p>
                <div className="flex items-center gap-2 text-sm">
                  <Cake className="h-4 w-4" />
                  <span>{student.age} years old</span>
                </div>
                <div className="flex items-center gap-2 text-sm mt-2">
                  <span className="font-semibold">Guardian:</span>
                  <span>{student.parent_guardian}</span>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute bottom-2 right-2"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedStudent(student);
                }}
              >
                <Expand className="h-5 w-5" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      {filteredStudents.length === 0 && (
        <p className="text-center text-muted-foreground">No students found matching your search.</p>
      )}
      <StudentDialog 
        student={selectedStudent} 
        isOpen={!!selectedStudent} 
        onClose={() => setSelectedStudent(null)} 
      />
    </div>
  );
}
