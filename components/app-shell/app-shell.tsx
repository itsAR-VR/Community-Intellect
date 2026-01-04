"use client"

import * as React from "react"
import type { Whoami } from "@/lib/auth/whoami"
import { Sidebar, MobileSidebar } from "@/components/app-shell/sidebar"
import { Topbar } from "@/components/app-shell/topbar"
import { AuthProvider } from "@/components/auth/auth-provider"

export function AppShell({
  initialWhoami,
  children,
}: {
  initialWhoami: Whoami | null
  children: React.ReactNode
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false)

  return (
    <AuthProvider initialWhoami={initialWhoami}>
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar collapsed={sidebarCollapsed} onCollapsedChange={setSidebarCollapsed} />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Topbar>
            <MobileSidebar />
          </Topbar>
          <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
        </div>
      </div>
    </AuthProvider>
  )
}
