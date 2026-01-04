"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  LayoutDashboard,
  Users,
  AlertTriangle,
  Lightbulb,
  MessageSquare,
  CheckCircle,
  Handshake,
  Gift,
  Calendar,
  Users2,
  ClipboardList,
  BookOpen,
  Bot,
  BarChart3,
  TrendingUp,
  Target,
  Layers,
  FileText,
  Inbox,
  Settings,
  Menu,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { CLUB_NAME } from "@/lib/club"

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

interface NavGroup {
  title: string
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    title: "Core",
    items: [
      { title: "Overview", href: "/overview", icon: LayoutDashboard },
      { title: "Members", href: "/members", icon: Users },
      { title: "Attention", href: "/attention", icon: AlertTriangle },
      { title: "Opportunities", href: "/opportunities", icon: Lightbulb },
      { title: "Drafts", href: "/drafts", icon: MessageSquare },
      { title: "Forced Success", href: "/forced-success", icon: CheckCircle },
    ],
  },
  {
    title: "Relationship Ops",
    items: [
      { title: "Intros", href: "/intros", icon: Handshake },
      { title: "Perks", href: "/perks", icon: Gift },
    ],
  },
  {
    title: "Programming",
    items: [
      { title: "Programming", href: "/programming", icon: Calendar },
      { title: "Pods", href: "/pods", icon: Users2 },
      { title: "Surveys", href: "/surveys", icon: ClipboardList },
      { title: "Resources", href: "/resources", icon: BookOpen },
    ],
  },
  {
    title: "Intelligence",
    items: [
      { title: "AI Chat", href: "/ai-chat", icon: Bot },
      { title: "Wrapped", href: "/analytics/wrapped", icon: BarChart3 },
      { title: "Market Signals", href: "/analytics/market-signals", icon: TrendingUp },
      { title: "Velocity", href: "/analytics/velocity", icon: Target },
      { title: "Segmentation", href: "/analytics/segmentation", icon: Layers },
    ],
  },
  {
    title: "Admin",
    items: [
      { title: "Audit Log", href: "/audit", icon: FileText },
      { title: "Outbox", href: "/outbox", icon: Inbox },
      { title: "Settings", href: "/settings", icon: Settings },
    ],
  },
]

interface SidebarProps {
  collapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
}

export function Sidebar({ collapsed = false, onCollapsedChange }: SidebarProps) {
  const pathname = usePathname()
  const basePath = "/app"

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "hidden md:flex flex-col border-r border-border bg-sidebar transition-all duration-300",
          collapsed ? "w-16" : "w-64",
        )}
      >
        <div className="flex items-center justify-between h-14 px-4 border-b border-sidebar-border">
          {!collapsed && (
            <Link href={`${basePath}/overview`} className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">C</span>
              </div>
              <span className="font-semibold text-sidebar-foreground">{CLUB_NAME}</span>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            className={cn("h-8 w-8 text-sidebar-foreground", collapsed && "mx-auto")}
            onClick={() => onCollapsedChange?.(!collapsed)}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        <ScrollArea className="flex-1 py-4">
          <nav className="space-y-6 px-2">
            {navGroups.map((group) => (
              <div key={group.title}>
                {!collapsed && (
                  <h4 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/60">
                    {group.title}
                  </h4>
                )}
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const isActive =
                      pathname === `${basePath}${item.href}` || pathname.startsWith(`${basePath}${item.href}/`)
                    const Icon = item.icon

                    const linkContent = (
                      <Link
                        href={`${basePath}${item.href}`}
                        className={cn(
                          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-sidebar-accent text-sidebar-accent-foreground"
                            : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                          collapsed && "justify-center px-2",
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span>{item.title}</span>}
                      </Link>
                    )

                    if (collapsed) {
                      return (
                        <Tooltip key={item.href}>
                          <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                          <TooltipContent side="right" className="bg-popover text-popover-foreground">
                            {item.title}
                          </TooltipContent>
                        </Tooltip>
                      )
                    }

                    return <div key={item.href}>{linkContent}</div>
                  })}
                </div>
              </div>
            ))}
          </nav>
        </ScrollArea>
      </aside>
    </TooltipProvider>
  )
}

export function MobileSidebar() {
  const [open, setOpen] = React.useState(false)
  const pathname = usePathname()
  const basePath = "/app"

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0 bg-sidebar">
        <div className="flex items-center h-14 px-4 border-b border-sidebar-border">
          <Link href={`${basePath}/overview`} className="flex items-center gap-2" onClick={() => setOpen(false)}>
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">C</span>
            </div>
            <span className="font-semibold text-sidebar-foreground">{CLUB_NAME}</span>
          </Link>
        </div>

        <ScrollArea className="h-[calc(100vh-3.5rem)] py-4">
          <nav className="space-y-6 px-2">
            {navGroups.map((group) => (
              <div key={group.title}>
                <h4 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/60">
                  {group.title}
                </h4>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const isActive =
                      pathname === `${basePath}${item.href}` || pathname.startsWith(`${basePath}${item.href}/`)
                    const Icon = item.icon

                    return (
                      <Link
                        key={item.href}
                        href={`${basePath}${item.href}`}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-sidebar-accent text-sidebar-accent-foreground"
                            : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span>{item.title}</span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </nav>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
