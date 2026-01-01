"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import { Sidebar, MobileSidebar } from "@/components/app-shell/sidebar"
import { Topbar } from "@/components/app-shell/topbar"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import type { TenantId } from "@/lib/types"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const params = useParams()
  const tenantId = params.tenantId as TenantId
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false)

  return (
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
      <Toaster />
    </ThemeProvider>
  )
}
