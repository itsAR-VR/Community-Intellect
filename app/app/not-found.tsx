import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center p-6">
      <div className="max-w-md text-center space-y-4">
        <div className="text-4xl font-bold tracking-tight">404</div>
        <div className="text-lg font-semibold">Page not found</div>
        <p className="text-sm text-muted-foreground">
          The page you’re looking for doesn’t exist, or you may not have access to it.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button asChild>
            <Link href="/app/b2b/overview">Go to Overview</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/login">Login</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

