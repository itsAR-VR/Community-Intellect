"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Lightbulb, MessageSquare, Target, X } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { RiskBadge } from "@/components/shared/risk-badge"
import { SourceBadge } from "@/components/shared/source-badge"
import { ActionTypeBadge } from "@/components/shared/action-type-badge"
import { ImpactScoreBar } from "@/components/shared/impact-score-bar"
import { EmptyState } from "@/components/shared/empty-state"
import { mockMembers, mockOpportunities } from "@/lib/mock-data"
import type { TenantId, SignalSource } from "@/lib/types"
import { formatDistanceToNow } from "date-fns"

export default function OpportunitiesPage() {
  const params = useParams()
  const tenantId = params.tenantId as TenantId

  const [sourceFilter, setSourceFilter] = React.useState<SignalSource | "all">("all")
  const [urgencyRange, setUrgencyRange] = React.useState([0, 10])
  const [selectedOpp, setSelectedOpp] = React.useState<string | null>(null)

  const opportunities = mockOpportunities.filter((o) => {
    const member = mockMembers.find((m) => m.id === o.memberId)
    if (!member || member.tenantId !== tenantId) return false
    if (o.dismissed) return false
    if (sourceFilter !== "all" && o.source !== sourceFilter) return false
    if (o.urgency < urgencyRange[0] || o.urgency > urgencyRange[1]) return false
    return true
  })

  const selectedOpportunity = opportunities.find((o) => o.id === selectedOpp)
  const selectedMember = selectedOpportunity ? mockMembers.find((m) => m.id === selectedOpportunity.memberId) : null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Opportunities</h1>
          <p className="text-muted-foreground">AI-detected opportunities for member engagement</p>
        </div>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <Select value={sourceFilter} onValueChange={(v) => setSourceFilter(v as SignalSource | "all")}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            <SelectItem value="slack">Slack</SelectItem>
            <SelectItem value="linkedin">LinkedIn</SelectItem>
            <SelectItem value="careers">Careers</SelectItem>
            <SelectItem value="survey">Survey</SelectItem>
            <SelectItem value="call">Call</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Urgency:</span>
          <div className="w-32">
            <Slider value={urgencyRange} onValueChange={setUrgencyRange} max={10} min={0} step={1} />
          </div>
          <span className="text-sm tabular-nums">
            {urgencyRange[0]}-{urgencyRange[1]}
          </span>
        </div>

        <Badge variant="secondary">{opportunities.length} opportunities</Badge>
      </div>

      {opportunities.length === 0 ? (
        <EmptyState
          icon={Lightbulb}
          title="No opportunities found"
          description="Adjust your filters or check back later for new opportunities."
        />
      ) : (
        <div className="grid gap-4">
          {opportunities.map((opp) => {
            const member = mockMembers.find((m) => m.id === opp.memberId)
            if (!member) return null

            return (
              <Card
                key={opp.id}
                className="hover:bg-accent/30 transition-colors cursor-pointer"
                onClick={() => setSelectedOpp(opp.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-muted text-muted-foreground">
                        {member.firstName[0]}
                        {member.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Link
                          href={`/app/${tenantId}/members/${member.id}`}
                          className="font-semibold hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {member.firstName} {member.lastName}
                        </Link>
                        <RiskBadge tier={member.riskTier} size="sm" />
                        <SourceBadge source={opp.source} size="sm" />
                      </div>
                      <p className="text-sm mb-2">{opp.summary}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {opp.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      <div className="flex items-center gap-2 justify-end">
                        <span className="text-xs text-muted-foreground">Urgency</span>
                        <Badge variant={opp.urgency >= 7 ? "destructive" : opp.urgency >= 4 ? "secondary" : "outline"}>
                          {opp.urgency}/10
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(opp.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  {opp.recommendedActions.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <p className="text-xs text-muted-foreground mb-2">Recommended Actions</p>
                      <div className="flex flex-wrap gap-2">
                        {opp.recommendedActions.slice(0, 3).map((action) => (
                          <div key={action.id} className="flex items-center gap-2">
                            <ActionTypeBadge type={action.type} size="sm" />
                            <ImpactScoreBar score={action.impactScore} size="sm" showLabel={false} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Sheet open={!!selectedOpp} onOpenChange={(open) => !open && setSelectedOpp(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selectedOpportunity && selectedMember && (
            <>
              <SheetHeader>
                <SheetTitle>Opportunity Details</SheetTitle>
                <SheetDescription>
                  For {selectedMember.firstName} {selectedMember.lastName}
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-muted">
                      {selectedMember.firstName[0]}
                      {selectedMember.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">
                      {selectedMember.firstName} {selectedMember.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {selectedMember.company.role} at {selectedMember.company.name}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Summary</h4>
                  <p className="text-sm text-muted-foreground">{selectedOpportunity.summary}</p>
                </div>

                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Source</p>
                    <SourceBadge source={selectedOpportunity.source} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Urgency</p>
                    <Badge variant={selectedOpportunity.urgency >= 7 ? "destructive" : "secondary"}>
                      {selectedOpportunity.urgency}/10
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Confidence</p>
                    <Badge variant="outline">{selectedOpportunity.confidence}%</Badge>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">Recommended Actions</h4>
                  {selectedOpportunity.recommendedActions.map((action) => (
                    <div key={action.id} className="rounded-lg border border-border p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <ActionTypeBadge type={action.type} />
                        <ImpactScoreBar score={action.impactScore} />
                      </div>
                      <p className="font-medium text-sm">{action.title}</p>
                      <p className="text-xs text-muted-foreground">{action.rationale}</p>
                      <Button size="sm" className="w-full">
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Create Draft
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 bg-transparent" onClick={() => setSelectedOpp(null)}>
                    <X className="mr-2 h-4 w-4" />
                    Dismiss
                  </Button>
                  <Button className="flex-1">
                    <Target className="mr-2 h-4 w-4" />
                    Add to Forced Success
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
