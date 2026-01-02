"use client"

import * as React from "react"
import type { TenantId } from "@/lib/types"
import type { Whoami } from "@/lib/auth/whoami"
import { ThemeProvider } from "@/components/theme-provider"
import { Sidebar, MobileSidebar } from "@/components/app-shell/sidebar"
import { Topbar } from "@/components/app-shell/topbar"
import { AuthProvider } from "@/components/auth/auth-provider"

export function AppShell({
  tenantId,
  initialWhoami,
  children,
}: {
  tenantId: TenantId
  initialWhoami: Whoami | null
  children: React.ReactNode
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false)

  return (
    <AuthProvider initialWhoami={initialWhoami}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
        <div className="flex h-screen overflow-hidden bg-background">
          <Sidebar tenantId={tenantId} collapsed={sidebarCollapsed} onCollapsedChange={setSidebarCollapsed} />
          <div className="flex flex-1 flex-col overflow-hidden">
            <Topbar tenantId={tenantId}>
              <MobileSidebar tenantId={tenantId} />
            </Topbar>
            <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
          </div>
        </div>
      </ThemeProvider>
    </AuthProvider>
  )
}
