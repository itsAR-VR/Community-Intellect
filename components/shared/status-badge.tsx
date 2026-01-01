import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import type { MemberStatus } from "@/lib/types"

interface StatusBadgeProps {
  status: MemberStatus
  size?: "sm" | "default"
}

const statusConfig: Record<MemberStatus, { label: string; className: string }> = {
  lead: {
    label: "Lead",
    className: "bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30",
  },
  accepted: {
    label: "Accepted",
    className: "bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border-cyan-500/30",
  },
  active: {
    label: "Active",
    className: "bg-success/20 text-success border-success/30",
  },
  churned: {
    label: "Churned",
    className: "bg-destructive/20 text-destructive border-destructive/30",
  },
  paused: {
    label: "Paused",
    className: "bg-muted text-muted-foreground border-muted",
  },
}

export function StatusBadge({ status, size = "default" }: StatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <Badge variant="outline" className={cn(config.className, size === "sm" && "text-xs px-1.5 py-0")}>
      {config.label}
    </Badge>
  )
}
