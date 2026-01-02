"use client"

import Link from "next/link"
import { AlertTriangle, MessageSquare, Clock, TrendingDown } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { RiskBadge } from "@/components/shared/risk-badge"
import type { TenantId, Member, ExternalSignal } from "@/lib/types"

interface AttentionItem {
  member: Member
  reasons: string[]
  suggestedPlaybook: string
  urgencyScore: number
}

export function AttentionClient({
  tenantId,
  members,
  signals,
}: {
  tenantId: TenantId
  members: Member[]
  signals: ExternalSignal[]
}) {

  const attentionItems: AttentionItem[] = members
    .map((member) => {
      const reasons: string[] = []
      let urgencyScore = 0

      if (member.riskTier === "red") {
        reasons.push("High risk score")
        urgencyScore += 40
      } else if (member.riskTier === "yellow") {
        reasons.push("Medium risk score")
        urgencyScore += 20
      }

      if (member.engagementScore < 40) {
        reasons.push("Low engagement")
        urgencyScore += 25
      }

      const lastEngagement = member.lastEngagementAt ? new Date(member.lastEngagementAt) : null
      const daysSinceEngagement = lastEngagement
        ? Math.floor((Date.now() - lastEngagement.getTime()) / (1000 * 60 * 60 * 24))
        : 999
      if (daysSinceEngagement > 14) {
        reasons.push(`No engagement in ${daysSinceEngagement} days`)
        urgencyScore += 20
      }

      if (!member.onboarding.intakeCompleted) {
        reasons.push("Intake not completed")
        urgencyScore += 15
      }

      if (!member.onboarding.welcomeCallCompleted) {
        reasons.push("Welcome call not completed")
        urgencyScore += 10
      }

      const memberSignals = signals.filter((s) => s.memberId === member.id)
      const negativeSignals = memberSignals.filter((s) => s.type === "sentiment" || s.type === "pain_point")
      if (negativeSignals.length > 0) {
        reasons.push("Recent negative signals")
        urgencyScore += 15
      }

      let suggestedPlaybook = "Check-in"
      if (!member.onboarding.intakeCompleted) {
        suggestedPlaybook = "Complete Onboarding"
      } else if (member.riskTier === "red") {
        suggestedPlaybook = "Retention Intervention"
      } else if (daysSinceEngagement > 21) {
        suggestedPlaybook = "Re-engagement Campaign"
      } else if (negativeSignals.length > 0) {
        suggestedPlaybook = "Support Outreach"
      }

      return { member, reasons, suggestedPlaybook, urgencyScore }
    })
    .filter((item) => item.reasons.length > 0)
    .sort((a, b) => b.urgencyScore - a.urgencyScore)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Attention Radar</h1>
        <p className="text-muted-foreground">Members requiring immediate attention, ranked by urgency</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-destructive/10 p-3">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{attentionItems.filter((i) => i.member.riskTier === "red").length}</p>
                <p className="text-sm text-muted-foreground">High Risk</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-warning/10 p-3">
                <TrendingDown className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {attentionItems.filter((i) => i.member.engagementScore < 40).length}
                </p>
                <p className="text-sm text-muted-foreground">Low Engagement</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-muted p-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {attentionItems.filter((i) => i.reasons.some((r) => r.includes("No engagement"))).length}
                </p>
                <p className="text-sm text-muted-foreground">Inactive 14+ Days</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Priority Attention Queue</CardTitle>
          <CardDescription>{attentionItems.length} members need attention</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {attentionItems.map((item) => (
              <div
                key={item.member.id}
                className="flex items-center gap-4 rounded-lg border border-border p-4 hover:bg-accent/50 transition-colors"
              >
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-muted text-muted-foreground">
                    {item.member.firstName[0]}
                    {item.member.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Link href={`/app/${tenantId}/members/${item.member.id}`} className="font-semibold hover:underline">
                      {item.member.firstName} {item.member.lastName}
                    </Link>
                    <RiskBadge tier={item.member.riskTier} score={item.member.riskScore} />
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {item.member.company.role} at {item.member.company.name}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {item.reasons.map((reason, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {reason}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="text-right space-y-2">
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                    {item.suggestedPlaybook}
                  </Badge>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/app/${tenantId}/members/${item.member.id}`}>Profile</Link>
                    </Button>
                    <Button size="sm">
                      <MessageSquare className="mr-1.5 h-3.5 w-3.5" />
                      Draft
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
