"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import type { TenantId, UserRole } from "@/lib/types"
import type { Whoami } from "@/lib/auth/whoami"
import { createSupabaseBrowserClient } from "@/lib/supabase/browser"

export type AuthContextValue = {
  user: Whoami["user"] | null
  tenants: Array<{ id: TenantId; name: string }>
  defaultTenantId: TenantId
  role: UserRole | null
  canEdit: boolean
  isAdmin: boolean
  refresh: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = React.createContext<AuthContextValue | null>(null)

export function AuthProvider({ initialWhoami, children }: { initialWhoami: Whoami | null; children: React.ReactNode }) {
  const router = useRouter()
  const supabase = React.useMemo(() => createSupabaseBrowserClient(), [])

  const [whoami, setWhoami] = React.useState<Whoami | null>(initialWhoami)

  const refresh = React.useCallback(async () => {
    const res = await fetch("/app/api/whoami", { cache: "no-store" })
    if (!res.ok) return
    const json = (await res.json()) as { whoami: Whoami | null }
    setWhoami(json.whoami)
  }, [])

  const logout = React.useCallback(async () => {
    await supabase.auth.signOut()
    setWhoami(null)
    router.push("/login")
    router.refresh()
  }, [router, supabase.auth])

  const role = whoami?.user.role ?? null
  const canEdit = role === "admin" || role === "community_manager"
  const isAdmin = role === "admin"

  const value = React.useMemo<AuthContextValue>(
    () => ({
      user: whoami?.user ?? null,
      tenants: whoami?.tenants ?? [],
      defaultTenantId: whoami?.defaultTenantId ?? "b2b",
      role,
      canEdit,
      isAdmin,
      refresh,
      logout,
    }),
    [canEdit, isAdmin, refresh, role, whoami, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuthContext() {
  const ctx = React.useContext(AuthContext)
  if (!ctx) throw new Error("useAuthContext must be used within <AuthProvider />")
  return ctx
}

