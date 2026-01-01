import { ExternalLink } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { SourceBadge } from "./source-badge"
import type { SignalSource } from "@/lib/types"

interface EvidenceItem {
  source: SignalSource
  url?: string
  snippet?: string
}

interface EvidenceChipsProps {
  items: EvidenceItem[]
  maxItems?: number
}

export function EvidenceChips({ items, maxItems = 3 }: EvidenceChipsProps) {
  const visibleItems = items.slice(0, maxItems)
  const remainingCount = items.length - maxItems

  return (
    <div className="flex flex-wrap gap-1.5">
      {visibleItems.map((item, index) =>
        item.url ? (
          <a
            key={index}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 hover:opacity-80 transition-opacity"
          >
            <SourceBadge source={item.source} size="sm" />
            <ExternalLink className="h-3 w-3 text-muted-foreground" />
          </a>
        ) : (
          <SourceBadge key={index} source={item.source} size="sm" />
        ),
      )}
      {remainingCount > 0 && (
        <Badge variant="secondary" className="text-xs">
          +{remainingCount} more
        </Badge>
      )}
    </div>
  )
}
