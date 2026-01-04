"use client"

import Link from "next/link"
import { Users, AlertTriangle, CheckCircle, MessageSquare, Calendar, ArrowRight } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { KpiCard } from "@/components/shared/kpi-card"
import { RiskBadge } from "@/components/shared/risk-badge"
import { ActionTypeBadge } from "@/components/shared/action-type-badge"
import { ImpactScoreBar } from "@/components/shared/impact-score-bar"
import type { ForcedSuccessItem, Member, MessageDraft, NotificationItem, OpportunityItem } from "@/lib/types"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"

export function OverviewClient({
  members,
  opportunities,
  forcedSuccessItems,
  drafts,
  notifications,
}: {
  members: Member[]
  opportunities: OpportunityItem[]
  forcedSuccessItems: ForcedSuccessItem[]
  drafts: MessageDraft[]
  notifications: NotificationItem[]
}) {
  const activeMembers = members.filter((m) => m.status === "active")
  const atRiskMembers = members.filter((m) => m.riskTier === "red")
  const yellowMembers = members.filter((m) => m.riskTier === "yellow")
  const pendingDrafts = drafts.filter((d) => d.status === "pending")
  const forcedSuccessDue = forcedSuccessItems.filter((f) => !f.deliveredAt && !f.blocked)
  const escalations = notifications.filter((n) => n.type === "escalation" && !n.read)

  const priorityActions = opportunities
    .filter((o) => !o.dismissed)
    .flatMap((o) => o.recommendedActions.map((a) => ({ ...a, memberId: o.memberId, opportunityId: o.id })))
    .sort((a, b) => b.impactScore - a.impactScore)
    .slice(0, 8)

  const complianceData = [
    { week: "W48", delivered: 42, target: 45 },
    { week: "W49", delivered: 45, target: 45 },
    { week: "W50", delivered: 40, target: 45 },
    { week: "W51", delivered: 44, target: 45 },
    { week: "W52", delivered: 43, target: 45 },
    { week: "W1", delivered: 38, target: 45 },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
        <p className="text-muted-foreground">Your retention intelligence dashboard</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Active Members"
          value={activeMembers.length}
          icon={Users}
          trend={{ value: 5, isPositive: true }}
          description="Total active membership"
        />
        <KpiCard
          title="At-Risk Members"
          value={atRiskMembers.length}
          icon={AlertTriangle}
          description={`${yellowMembers.length} yellow, ${atRiskMembers.length} red`}
        />
        <KpiCard
          title="Forced Success Due"
          value={forcedSuccessDue.length}
          icon={CheckCircle}
          description="Value drops needed this week"
        />
        <KpiCard
          title="Pending Drafts"
          value={pendingDrafts.length}
          icon={MessageSquare}
          description="Awaiting review/send"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Priority Actions</CardTitle>
              <CardDescription>Highest impact actions across all members</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/app/opportunities">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {priorityActions.map((action) => {
                const member = members.find((m) => m.id === action.memberId)
                return (
                  <div
                    key={action.id}
                    className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg border border-border p-3 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarFallback className="bg-muted text-muted-foreground text-sm">
                          {member?.firstName?.[0]}
                          {member?.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link
                            href={`/app/members/${member?.id}`}
                            className="font-medium hover:underline whitespace-nowrap"
                          >
                            {member?.firstName} {member?.lastName}
                          </Link>
                          <RiskBadge tier={member?.riskTier ?? "green"} size="sm" />
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{action.title}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 sm:ml-auto pl-13 sm:pl-0">
                      <ActionTypeBadge type={action.type} size="sm" />
                      <ImpactScoreBar score={action.impactScore} size="sm" />
                      <Button size="sm" variant="outline" asChild className="shrink-0 bg-transparent">
                        <Link href="/app/drafts">Draft</Link>
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Forced Success Compliance</CardTitle>
              <CardDescription>Weekly value drops delivered</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={complianceData}>
                  <XAxis dataKey="week" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="delivered" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base">Escalations</CardTitle>
              <Badge variant="destructive">{escalations.length}</Badge>
            </CardHeader>
            <CardContent>
              {escalations.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No active escalations</p>
              ) : (
                <div className="space-y-3">
                  {escalations.slice(0, 3).map((escalation) => (
                    <div key={escalation.id} className="flex items-start gap-3 text-sm">
                      <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                      <div>
                        <p className="font-medium">{escalation.title}</p>
                        <p className="text-muted-foreground text-xs">{escalation.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Red Risk Members</CardTitle>
              <CardDescription>Require immediate attention</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/app/attention">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {atRiskMembers.slice(0, 5).map((member) => (
                <Link
                  key={member.id}
                  href={`/app/members/${member.id}`}
                  className="flex items-center gap-3 rounded-lg p-2 hover:bg-accent/50 transition-colors"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-destructive/20 text-destructive text-sm">
                      {member.firstName[0]}
                      {member.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">
                      {member.firstName} {member.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{member.company.name}</p>
                  </div>
                  <RiskBadge tier="red" score={member.riskScore} showScore />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Upcoming Renewals</CardTitle>
              <CardDescription>Next 30 days</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {members
                .filter((m) => m.renewalDate)
                .filter((m) => {
                  const renewalDate = new Date(m.renewalDate!)
                  const now = new Date()
                  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
                  return renewalDate <= thirtyDaysFromNow && renewalDate >= now
                })
                .slice(0, 5)
                .map((member) => (
                  <Link
                    key={member.id}
                    href={`/app/members/${member.id}`}
                    className="flex items-center gap-3 rounded-lg p-2 hover:bg-accent/50 transition-colors"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-muted text-muted-foreground text-sm">
                        {member.firstName[0]}
                        {member.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">
                        {member.firstName} {member.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{member.company.name}</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(member.renewalDate!).toLocaleDateString()}
                    </div>
                  </Link>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
