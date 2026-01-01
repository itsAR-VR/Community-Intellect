"use client"

import { useState, useEffect } from "react"
import type { AuthState, UserRole, TenantId } from "@/lib/types"

const DEFAULT_AUTH: AuthState = {
  user: {
    id: "user_001",
    name: "Admin User",
    email: "admin@cmoclub.io",
    role: "admin",
  },
  tenantId: "b2b",
}

export function useAuth() {
  const [auth, setAuth] = useState<AuthState>(DEFAULT_AUTH)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check localStorage for saved auth state
    const savedAuth = localStorage.getItem("cmo-club-auth")
    if (savedAuth) {
      try {
        setAuth(JSON.parse(savedAuth))
      } catch {
        setAuth(DEFAULT_AUTH)
      }
    }
    setIsLoading(false)
  }, [])

  const login = (role: UserRole) => {
    const newAuth: AuthState = {
      user: {
        id: `user_${Date.now()}`,
        name: role === "admin" ? "Admin User" : role === "community_manager" ? "CM User" : "Viewer",
        email: `${role}@cmoclub.io`,
        role,
      },
      tenantId: "b2b",
    }
    setAuth(newAuth)
    localStorage.setItem("cmo-club-auth", JSON.stringify(newAuth))
  }

  const logout = () => {
    setAuth({ user: null, tenantId: "b2b" })
    localStorage.removeItem("cmo-club-auth")
  }

  const switchTenant = (tenantId: TenantId) => {
    const newAuth = { ...auth, tenantId }
    setAuth(newAuth)
    localStorage.setItem("cmo-club-auth", JSON.stringify(newAuth))
  }

  const canEdit = auth.user?.role === "admin" || auth.user?.role === "community_manager"
  const isAdmin = auth.user?.role === "admin"

  return {
    user: auth.user,
    tenantId: auth.tenantId,
    isLoading,
    isAuthenticated: !!auth.user,
    canEdit,
    isAdmin,
    login,
    logout,
    switchTenant,
  }
}
