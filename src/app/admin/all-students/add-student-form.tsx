import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import axios from 'axios'
import { MODEL_API_BASE_URL } from '@/components/utils/admin/admin_utils'

interface AddStudentFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function AddStudentForm({ isOpen, onClose, onSuccess }: AddStudentFormProps) {
  const [formData, setFormData] = useState({
    userid: '',
    first_name: '',
    last_name: '',
    grade: '',
    age: '',
    parent_guardian: '',
    email: '',
    phone: '',
    country: '',
    user_context: ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.userid || !formData.first_name || !formData.last_name || !formData.age || !formData.email) {
      alert('Please fill in all required fields: User ID, First Name, Last Name, Age, and Email.')
      return
    }
    try {
      await axios.post(`${MODEL_API_BASE_URL}/users/`, formData)
      onSuccess()
      onClose()
    } catch (error) {
      alert(`There was an error adding the student: ${(error as any).message}. Please try again.`)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Student</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="userid" className="text-right">
                User ID <span className="text-red-500">*</span>
              </Label>
              <Input
                id="userid"
                name="userid"
                value={formData.userid}
                onChange={handleChange}
                className="col-span-3"
                placeholder="Enter user ID"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="first_name" className="text-right">
                First Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="first_name"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                className="col-span-3"
                placeholder="Enter first name"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="last_name" className="text-right">
                Last Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="last_name"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                className="col-span-3"
                placeholder="Enter last name"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="grade" className="text-right">
                Grade
              </Label>
              <Input
                id="grade"
                name="grade"
                value={formData.grade}
                onChange={handleChange}
                className="col-span-3"
                placeholder="Enter grade"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="age" className="text-right">
                Age <span className="text-red-500">*</span>
              </Label>
              <Input
                id="age"
                name="age"
                type="number"
                value={formData.age}
                onChange={handleChange}
                className="col-span-3"
                placeholder="Enter age"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="parent_guardian" className="text-right">
                Parent/Guardian
              </Label>
              <Input
                id="parent_guardian"
                name="parent_guardian"
                value={formData.parent_guardian}
                onChange={handleChange}
                className="col-span-3"
                placeholder="Enter parent/guardian name"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="col-span-3"
                placeholder="Enter email"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">
                Phone
              </Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="col-span-3"
                placeholder="Enter phone number"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="country" className="text-right">
                Country
              </Label>
              <Input
                id="country"
                name="country"
                value={formData.country}
                onChange={handleChange}
                className="col-span-3"
                placeholder="Enter country"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="user_context" className="text-right">
                User Context
              </Label>
              <Input
                id="user_context"
                name="user_context"
                value={formData.user_context}
                onChange={handleChange}
                className="col-span-3"
                placeholder="Enter user context"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Add Student</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
