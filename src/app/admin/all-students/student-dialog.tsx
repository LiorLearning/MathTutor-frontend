import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
  } from "@/components/ui/dialog"
  import { Student } from '@/components/utils/admin/admin_utils'
  import { Cake } from 'lucide-react'
  import { Button } from "@/components/ui/button"
  import axios from 'axios'
  import { MODEL_API_BASE_URL } from '@/components/utils/admin/admin_utils'
  
  interface StudentDialogProps {
    student: Student | null
    isOpen: boolean
    onClose: () => void
  }
  
  export function StudentDialog({ student, isOpen, onClose }: StudentDialogProps) {
    if (!student) return null

    const handleDelete = async () => {
      try {
        await axios.delete(`${MODEL_API_BASE_URL}/users/${student.userid}`)
        onClose()
        // Optionally, you can add a callback to refresh the student list
      } catch (error) {
        console.error('Error deleting student:', error)
        // Handle error (e.g., show error message to user)
      }
    }
  
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{student.first_name} {student.last_name}</DialogTitle>
          </DialogHeader>
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
          <DialogFooter>
            <Button variant="destructive" onClick={handleDelete}>Delete Student</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }