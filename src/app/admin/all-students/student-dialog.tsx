import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
  } from "@/components/ui/dialog"
  import { Student } from '@/components/utils/admin/admin_utils'
  import { Cake } from 'lucide-react'
  
  interface StudentDialogProps {
    student: Student | null
    isOpen: boolean
    onClose: () => void
  }
  
  export function StudentDialog({ student, isOpen, onClose }: StudentDialogProps) {
    if (!student) return null
  
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
        </DialogContent>
      </Dialog>
    )
  }
  
  