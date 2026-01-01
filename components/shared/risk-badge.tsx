import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { RiskTier } from "@/lib/types"

interface RiskBadgeProps {
  tier: RiskTier
  score?: number
  showScore?: boolean
  size?: "sm" | "default"
}

const tierConfig = {
  green: {
    label: "Low Risk",
    className: "bg-success/20 text-success hover:bg-success/30 border-success/30",
  },
  yellow: {
    label: "Medium Risk",
    className: "bg-warning/20 text-warning hover:bg-warning/30 border-warning/30",
  },
  red: {
    label: "High Risk",
    className: "bg-destructive/20 text-destructive hover:bg-destructive/30 border-destructive/30",
  },
}

export function RiskBadge({ tier, score, showScore = false, size = "default" }: RiskBadgeProps) {
  const config = tierConfig[tier]

  const badge = (
    <Badge variant="outline" className={cn(config.className, size === "sm" && "text-xs px-1.5 py-0")}>
      {showScore && score !== undefined ? `${score}` : config.label}
    </Badge>
  )

  if (score !== undefined) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{badge}</TooltipTrigger>
          <TooltipContent>
            <p>
              {config.label} - Score: {score}/100
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return badge
}
