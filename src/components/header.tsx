import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full bg-primary text-white shadow-md">
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-wider">
            <span>MathBuddy</span>
          </h1>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-12 w-12 rounded-full p-0">
                <Avatar className="h-12 w-12 border-2 border-white">
                  <AvatarImage src="/images/placeholder-avatar.jpg" alt="Kid's profile" />
                  <AvatarFallback className="text-xl font-bold text-primary bg-white">KB</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-white rounded-xl shadow-lg" align="end">
              <div className="flex items-center p-4 space-x-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage src="/images/placeholder-avatar.jpg" alt="Kid's profile" />
                  <AvatarFallback className="text-lg font-bold text-primary bg-yellow-300">KB</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-gray-900">Math Explorer</p>
                  <p className="text-xs text-gray-500">Level 5</p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-sm py-2 cursor-pointer hover:bg-primary-100">
                My Achievements
              </DropdownMenuItem>
              <DropdownMenuItem className="text-sm py-2 cursor-pointer hover:bg-primary-100">
                Change Avatar
              </DropdownMenuItem>
              <DropdownMenuItem className="text-sm py-2 cursor-pointer hover:bg-primary-100">
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-sm py-2 cursor-pointer hover:bg-red-100 text-red-600">
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}