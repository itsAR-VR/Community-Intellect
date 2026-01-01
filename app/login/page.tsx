"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import type { UserRole } from "@/lib/types"

export default function LoginPage() {
  const router = useRouter()
  const [role, setRole] = React.useState<UserRole>("admin")
  const [isLoading, setIsLoading] = React.useState(false)

  const handleLogin = () => {
    setIsLoading(true)
    // Store role in localStorage for demo RBAC
    localStorage.setItem(
      "auth",
      JSON.stringify({
        user: {
          id: "user_001",
          name: "Demo User",
          email: "demo@cmoclub.com",
          role,
        },
        tenantId: "b2b",
      }),
    )
    setTimeout(() => {
      router.push("/app/b2b/overview")
    }, 500)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto h-12 w-12 rounded-xl bg-primary flex items-center justify-center mb-4">
            <span className="text-primary-foreground font-bold text-xl">C</span>
          </div>
          <CardTitle className="text-2xl">CMO Club AI</CardTitle>
          <CardDescription>Retention Intelligence Dashboard</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label>Select your role</Label>
            <RadioGroup value={role} onValueChange={(v) => setRole(v as UserRole)} className="space-y-2">
              <div className="flex items-center space-x-3 rounded-lg border border-border p-3 hover:bg-accent/50 transition-colors">
                <RadioGroupItem value="admin" id="admin" />
                <Label htmlFor="admin" className="flex-1 cursor-pointer">
                  <div className="font-medium">Admin</div>
                  <div className="text-sm text-muted-foreground">Full access to all features</div>
                </Label>
              </div>
              <div className="flex items-center space-x-3 rounded-lg border border-border p-3 hover:bg-accent/50 transition-colors">
                <RadioGroupItem value="community_manager" id="cm" />
                <Label htmlFor="cm" className="flex-1 cursor-pointer">
                  <div className="font-medium">Community Manager</div>
                  <div className="text-sm text-muted-foreground">Manage members and drafts</div>
                </Label>
              </div>
              <div className="flex items-center space-x-3 rounded-lg border border-border p-3 hover:bg-accent/50 transition-colors">
                <RadioGroupItem value="read_only" id="readonly" />
                <Label htmlFor="readonly" className="flex-1 cursor-pointer">
                  <div className="font-medium">Read Only</div>
                  <div className="text-sm text-muted-foreground">View-only access</div>
                </Label>
              </div>
            </RadioGroup>
          </div>
          <Button onClick={handleLogin} className="w-full" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Continue to Dashboard"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
