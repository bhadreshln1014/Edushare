"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { UserCircle, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const [userId, setUserId] = useState(null)
  
  useEffect(() => {
    // Get the user ID from localStorage on the client side
    const userString = localStorage.getItem("user")
    if (userString) {
      const user = JSON.parse(userString)
      setUserId(user.id)
    }
  }, [])

  const handleLogout = () => {
    // Clear user session data
    localStorage.removeItem("user")
    localStorage.removeItem("token")
    // Redirect to login page
    router.push("/login")
  }

  // Hide header on login and register pages
  if (pathname === "/login" || pathname === "/register" || pathname === "/") {
    return null
  }

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="font-semibold text-lg">
            EduShare
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-2 text-sm">Dashboard</Link>
            <Link href="/resources" className="flex items-center gap-2 text-sm">Resources</Link>
            <Link href="/find-educators" className="flex items-center gap-2 text-sm">Find Educators</Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={handleLogout}
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
          <Link href={userId ? `/profile/${userId}` : "/profile"}>
            <UserCircle className="h-8 w-8 text-gray-500 hover:text-gray-700" />
          </Link>
        </div>
      </div>
    </header>
  )
}