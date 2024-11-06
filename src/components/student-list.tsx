'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { User, Cake, Search, ArrowLeft, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import axios from 'axios'
import { Student, MODEL_API_BASE_URL } from '@/components/utils/admin/admin_utils'


export function StudentList() {
  const [searchTerm, setSearchTerm] = useState('')
  const [students, setStudents] = useState<Student[]>([])
  const [expandedCards, setExpandedCards] = useState<{ [key: string]: boolean }>({})

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await axios.get<Student[]>(`${MODEL_API_BASE_URL}/users/`);
        setStudents(response.data);
      } catch (error) {
        console.error('Error fetching students:', error);
      }
    };

    fetchStudents();
  }, []);

  const filteredStudents = students.filter(student => 
    student.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.userid.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const toggleExpand = (userid: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setExpandedCards(prev => ({ ...prev, [userid]: !prev[userid] }));
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
      <div className="space-y-4">
        {filteredStudents.map((student, index) => (
          <Card 
            key={`${student.userid}-${index}`} 
            className="w-full cursor-pointer hover:shadow-lg transition-shadow bg-card text-card-foreground"
            onClick={() => window.location.assign(`/admin/student?username=${student.userid}`)}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {student.first_name} {student.last_name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between">
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
              </div>
              {expandedCards[student.userid] && (
                <div className="mt-4">
                  
                  <div className="flex items-center gap-2 text-sm mt-2">
                    <span className="font-semibold">Country:</span>
                    <span>{student.country}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm mt-2">
                    <span className="font-semibold">Grade:</span>
                    <span>{student.grade}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm mt-2">
                    <span className="font-semibold">Email:</span>
                    <span>{student.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm mt-2">
                    <span className="font-semibold">Phone:</span>
                    <span>{student.phone}</span>
                  </div>
                  <div className="mt-2">
                    <span className="font-semibold">Context:</span>
                    <p className="text-sm mt-1">{student.user_context}</p>
                  </div>
                </div>
              )}
              <div className='flex justify-end'>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => toggleExpand(student.userid, e)}
                >
                  {expandedCards[student.userid] ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {filteredStudents.length === 0 && (
          <p className="text-center text-muted-foreground">No students found matching your search.</p>
        )}
      </div>
    </div>
  );
}