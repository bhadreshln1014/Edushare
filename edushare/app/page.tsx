import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="flex min-h-[calc(100vh-64px)] flex-col items-center justify-center p-4 text-center">
      <h1 className="text-4xl font-bold mb-4">Welcome to EduShare</h1>
      <p className="text-lg text-muted-foreground mb-8 max-w-md">Connect, share, and discover educational resources</p>
      <div className="flex gap-4">
        <Button asChild size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white">
          <Link href="/login">Sign In</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/register">Create Account</Link>
        </Button>
      </div>
    </div>
  )
}
