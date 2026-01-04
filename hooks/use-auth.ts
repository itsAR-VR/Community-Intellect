"use client"

import { useAuthContext } from "@/components/auth/auth-provider"

export function useAuth() {
  const { user, club, role, canEdit, isAdmin, refresh, logout } = useAuthContext()

  return {
    user,
    club,
    role,
    canEdit,
    isAdmin,
    refresh,
    logout,
    isLoading: false,
    isAuthenticated: !!user,
  }
}
