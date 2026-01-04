"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { toast } from "@/hooks/use-toast"
import { createSupabaseBrowserClient } from "@/lib/supabase/browser"

export function LoginClient({ nextUrl }: { nextUrl?: string }) {
  const router = useRouter()
  const supabase = React.useMemo(() => createSupabaseBrowserClient(), [])

  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)

  const handleLogin = async () => {
    setIsLoading(true)
    try {
      if (!supabase) {
        throw new Error(
          "Supabase env is missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, then redeploy/restart.",
        )
      }
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error

      if (nextUrl) {
        router.push(nextUrl)
        router.refresh()
        return
      }

      router.push("/app/overview")
      router.refresh()
    } catch (e) {
      toast({ title: "Sign-in failed", description: e instanceof Error ? e.message : "Unknown error" })
    } finally {
      setIsLoading(false)
    }
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
          <form
            className="space-y-6"
            onSubmit={(e) => {
              e.preventDefault()
              void handleLogin()
            }}
          >
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="email" />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                autoComplete="current-password"
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading || !email || !password || !supabase}>
              {isLoading ? "Signing in..." : "Continue to Dashboard"}
            </Button>
            {!supabase && (
              <p className="text-sm text-muted-foreground">
                Supabase is not configured. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` and
                redeploy/restart.
              </p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
