import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { type LucideIcon, TrendingUp, TrendingDown } from "lucide-react"

interface KpiCardProps {
  title: string
  value: string | number
  description?: string
  icon: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
  className?: string
}

export function KpiCard({ title, value, description, icon: Icon, trend, className }: KpiCardProps) {
  return (
    <Card className={cn("bg-card", className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold">{value}</p>
              {trend && (
                <span
                  className={cn(
                    "flex items-center text-sm font-medium",
                    trend.isPositive ? "text-success" : "text-destructive",
                  )}
                >
                  {trend.isPositive ? (
                    <TrendingUp className="mr-1 h-4 w-4" />
                  ) : (
                    <TrendingDown className="mr-1 h-4 w-4" />
                  )}
                  {trend.value}%
                </span>
              )}
            </div>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </div>
          <div className="rounded-lg bg-primary/10 p-3">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
