import type React from "react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import {
  MessageSquare,
  Linkedin,
  Briefcase,
  Search,
  Instagram,
  Twitter,
  Phone,
  ClipboardList,
  FileText,
  Pencil,
} from "lucide-react"
import type { FactProvenance, SignalSource } from "@/lib/types"

type SourceBadgeSource = SignalSource | FactProvenance

interface SourceBadgeProps {
  source: SourceBadgeSource
  size?: "sm" | "default"
}

const sourceConfig: Record<
  SourceBadgeSource,
  { label: string; icon: React.ComponentType<{ className?: string }>; className: string }
> = {
  slack: {
    label: "Slack",
    icon: MessageSquare,
    className: "bg-[#4A154B]/20 text-[#4A154B] dark:text-[#E01E5A] border-[#4A154B]/30",
  },
  linkedin: {
    label: "LinkedIn",
    icon: Linkedin,
    className: "bg-[#0A66C2]/20 text-[#0A66C2] border-[#0A66C2]/30",
  },
  careers: {
    label: "Careers",
    icon: Briefcase,
    className: "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  },
  indeed: {
    label: "Indeed",
    icon: Search,
    className: "bg-blue-600/20 text-blue-600 border-blue-600/30",
  },
  instagram: {
    label: "Instagram",
    icon: Instagram,
    className: "bg-pink-500/20 text-pink-500 border-pink-500/30",
  },
  x: {
    label: "X",
    icon: Twitter,
    className: "bg-foreground/10 text-foreground border-foreground/20",
  },
  call: {
    label: "Call",
    icon: Phone,
    className: "bg-success/20 text-success border-success/30",
  },
  survey: {
    label: "Survey",
    icon: ClipboardList,
    className: "bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/30",
  },
  intake: {
    label: "Intake",
    icon: FileText,
    className: "bg-primary/20 text-primary border-primary/30",
  },
  manual: {
    label: "Manual",
    icon: Pencil,
    className: "bg-muted text-muted-foreground border-muted",
  },
  external: {
    label: "External",
    icon: Search,
    className: "bg-foreground/10 text-foreground border-foreground/20",
  },
}

export function SourceBadge({ source, size = "default" }: SourceBadgeProps) {
  const config = sourceConfig[source]
  const Icon = config.icon

  return (
    <Badge variant="outline" className={cn("gap-1", config.className, size === "sm" && "text-xs px-1.5 py-0")}>
      <Icon className={cn("h-3 w-3", size === "sm" && "h-2.5 w-2.5")} />
      {config.label}
    </Badge>
  )
}
