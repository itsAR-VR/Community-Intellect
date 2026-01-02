import Link from "next/link"
import { ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function ForbiddenPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-destructive" />
            Access denied
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            You don’t have access to this tenant. If you believe this is a mistake, ask an admin to grant access.
          </p>
          <div className="flex gap-2">
            <Button asChild variant="outline" className="bg-transparent flex-1">
              <Link href="/login">Switch account</Link>
            </Button>
            <Button asChild className="flex-1">
              <Link href="/app/b2b/overview">Go to dashboard</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

