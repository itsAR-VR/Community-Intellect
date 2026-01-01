import type React from "react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Handshake, Gift, BookOpen, Calendar, MessageCircle, Users, ArrowRight, AlertTriangle } from "lucide-react"
import type { ActionType } from "@/lib/types"

interface ActionTypeBadgeProps {
  type: ActionType
  size?: "sm" | "default"
}

const actionConfig: Record<
  ActionType,
  { label: string; icon: React.ComponentType<{ className?: string }>; className: string }
> = {
  intro: {
    label: "Intro",
    icon: Handshake,
    className: "bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30",
  },
  perk: {
    label: "Perk",
    icon: Gift,
    className: "bg-pink-500/20 text-pink-600 dark:text-pink-400 border-pink-500/30",
  },
  resource: {
    label: "Resource",
    icon: BookOpen,
    className: "bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30",
  },
  workshop_invite: {
    label: "Workshop",
    icon: Calendar,
    className: "bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/30",
  },
  check_in: {
    label: "Check-in",
    icon: MessageCircle,
    className: "bg-success/20 text-success border-success/30",
  },
  mastermind_invite: {
    label: "Mastermind",
    icon: Users,
    className: "bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border-cyan-500/30",
  },
  follow_up: {
    label: "Follow-up",
    icon: ArrowRight,
    className: "bg-muted text-muted-foreground border-muted",
  },
  escalation: {
    label: "Escalation",
    icon: AlertTriangle,
    className: "bg-destructive/20 text-destructive border-destructive/30",
  },
}

export function ActionTypeBadge({ type, size = "default" }: ActionTypeBadgeProps) {
  const config = actionConfig[type]
  const Icon = config.icon

  return (
    <Badge variant="outline" className={cn("gap-1", config.className, size === "sm" && "text-xs px-1.5 py-0")}>
      <Icon className={cn("h-3 w-3", size === "sm" && "h-2.5 w-2.5")} />
      {config.label}
    </Badge>
  )
}
