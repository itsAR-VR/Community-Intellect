"use client"

import { useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-[70vh] items-center justify-center p-6">
      <div className="max-w-md text-center space-y-4">
        <div className="text-lg font-semibold">Something went wrong</div>
        <p className="text-sm text-muted-foreground">
          Try again, or go back to the overview. If this keeps happening, check server logs.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button onClick={reset}>Try again</Button>
          <Button asChild variant="outline">
            <Link href="/app/b2b/overview">Go to Overview</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
