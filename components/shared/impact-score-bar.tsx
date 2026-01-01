import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface ImpactScoreBarProps {
  score: number
  showLabel?: boolean
  size?: "sm" | "default"
}

export function ImpactScoreBar({ score, showLabel = true, size = "default" }: ImpactScoreBarProps) {
  const getColor = (score: number) => {
    if (score >= 70) return "bg-success"
    if (score >= 40) return "bg-warning"
    return "bg-muted-foreground"
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2">
            <div className={cn("h-2 rounded-full bg-muted overflow-hidden", size === "sm" ? "w-16" : "w-24")}>
              <div
                className={cn("h-full rounded-full transition-all", getColor(score))}
                style={{ width: `${score}%` }}
              />
            </div>
            {showLabel && (
              <span className={cn("font-medium tabular-nums", size === "sm" ? "text-xs" : "text-sm")}>{score}</span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Impact Score: {score}/100</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
