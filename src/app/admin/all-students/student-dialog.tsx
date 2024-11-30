import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Student } from '@/components/utils/admin/admin_utils'
import { Cake, Edit } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import axios from 'axios'
import { MODEL_API_BASE_URL } from '@/components/utils/admin/admin_utils'

interface StudentDialogProps {
  student: Student | null
  isOpen: boolean
  onClose: () => void
}

export function StudentDialog({ student, isOpen, onClose }: StudentDialogProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedStudent, setEditedStudent] = useState<Student | null>(null)

  if (!student) return null

  const handleEdit = () => {
    setEditedStudent(student)
    setIsEditing(true)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (editedStudent) {
      setEditedStudent({
        ...editedStudent,
        [e.target.name]: e.target.value
      })
    }
  }

  const handleSave = async () => {
    if (!editedStudent) return

    try {
      await axios.put(`${MODEL_API_BASE_URL}/users/${editedStudent.userid}`, editedStudent)
      setIsEditing(false)
      onClose()
    } catch (error: any) {
      alert(`There was an error updating the student: ${error}. Please try again.`)
    }
  }

  const handleDelete = async () => {
    try {
      await axios.delete(`${MODEL_API_BASE_URL}/users/${student.userid}`)
      onClose()
    } catch (error: any) {
      alert(`There was an error deleting the student: ${error}. Please try again.`)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{student.first_name} {student.last_name}</DialogTitle>
        </DialogHeader>
        {isEditing ? (
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="font-semibold">First Name:</span>
              <Input
                name="first_name"
                value={editedStudent?.first_name || ''}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="font-semibold">Last Name:</span>
              <Input
                name="last_name"
                value={editedStudent?.last_name || ''}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="font-semibold">Age:</span>
              <Input
                name="age"
                type="number"
                value={editedStudent?.age || ''}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="font-semibold">Guardian:</span>
              <Input
                name="parent_guardian"
                value={editedStudent?.parent_guardian || ''}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="font-semibold">Country:</span>
              <Input
                name="country"
                value={editedStudent?.country || ''}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="font-semibold">Grade:</span>
              <Input
                name="grade"
                value={editedStudent?.grade || ''}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="font-semibold">Email:</span>
              <Input
                name="email"
                type="email"
                value={editedStudent?.email || ''}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="font-semibold">Phone:</span>
              <Input
                name="phone"
                value={editedStudent?.phone || ''}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div>
              <span className="font-semibold">Context:</span>
              <Textarea
                name="user_context"
                value={editedStudent?.user_context || ''}
                onChange={handleInputChange}
                className="mt-1"
              />
            </div>
          </div>
        ) : (
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="font-semibold">UserID:</span>
              <span className="col-span-3">@{student.userid}</span>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Cake className="h-4 w-4" />
              <span className="col-span-3">{student.age} years old</span>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="font-semibold">Guardian:</span>
              <span className="col-span-3">{student.parent_guardian}</span>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="font-semibold">Country:</span>
              <span className="col-span-3">{student.country}</span>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="font-semibold">Grade:</span>
              <span className="col-span-3">{student.grade}</span>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="font-semibold">Email:</span>
              <span className="col-span-3">{student.email}</span>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="font-semibold">Phone:</span>
              <span className="col-span-3">{student.phone}</span>
            </div>
            <div>
              <span className="font-semibold">Context:</span>
              <p className="mt-1 text-sm">{student.user_context}</p>
            </div>
          </div>
        )}
        <DialogFooter>
          {isEditing ? (
            <>
              <Button onClick={() => setIsEditing(false)}>Cancel</Button>
              <Button onClick={handleSave}>Save</Button>
            </>
          ) : (
            <>
              <Button onClick={handleEdit}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button variant="destructive" onClick={handleDelete}>Delete Student</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

