"use client"

import { useAuthContext } from "@/components/auth/auth-provider"

export function useAuth() {
  const { user, tenants, defaultTenantId, role, canEdit, isAdmin, refresh, logout } = useAuthContext()

  return {
    user,
    tenants,
    defaultTenantId,
    role,
    canEdit,
    isAdmin,
    refresh,
    logout,
    isLoading: false,
    isAuthenticated: !!user,
  }
}
