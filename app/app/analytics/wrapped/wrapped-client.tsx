"use client"

import * as React from "react"
import { BarChart3, TrendingUp, TrendingDown, Handshake, Gift, Calendar, BookOpen, Download } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RiskBadge } from "@/components/shared/risk-badge"
import { toast } from "@/hooks/use-toast"
import type { Member, MemberWrapped } from "@/lib/types"

export function WrappedClient({ members, wrapped }: { members: Member[]; wrapped: MemberWrapped[] }) {
  const [selectedMemberId, setSelectedMemberId] = React.useState<string>(members[0]?.id ?? "")

  const wrappedForMember = wrapped.find((w) => w.memberId === selectedMemberId)
  const member = members.find((m) => m.id === selectedMemberId)

  if (!member) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No members found</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Member Wrapped</h1>
          <p className="text-muted-foreground">Spotify Wrapped-style progress narrative</p>
        </div>
        <Button
          variant="outline"
          onClick={async () => {
            try {
              const payload = {
                member,
                wrapped: wrappedForMember ?? null,
              }
              await navigator.clipboard.writeText(JSON.stringify(payload, null, 2))
              toast({ title: "Copied export JSON to clipboard" })
            } catch {
              toast({ title: "Export failed" })
            }
          }}
        >
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
          <SelectTrigger className="w-[300px]">
            <SelectValue placeholder="Select member" />
          </SelectTrigger>
          <SelectContent>
            {members.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.firstName} {m.lastName} - {m.company.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-4 p-6 rounded-xl bg-gradient-to-r from-primary/20 to-primary/5 border border-primary/20">
        <Avatar className="h-16 w-16">
          <AvatarFallback className="bg-primary text-primary-foreground text-xl">
            {member.firstName[0]}
            {member.lastName[0]}
          </AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-2xl font-bold">
            {member.firstName} {member.lastName}'s Journey
          </h2>
          <p className="text-muted-foreground">
            {member.company.role} at {member.company.name}
          </p>
        </div>
      </div>

      {wrappedForMember ? (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Where They Started
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Initial Goals</p>
                <div className="flex flex-wrap gap-2">
                  {wrappedForMember.startSnapshot.goals.map((goal, i) => (
                    <Badge key={i} variant="outline">
                      {goal}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Bottlenecks</p>
                <div className="flex flex-wrap gap-2">
                  {wrappedForMember.startSnapshot.bottlenecks.map((b, i) => (
                    <Badge key={i} variant="secondary">
                      {b}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Risk Level:</span>
                <RiskBadge tier={wrappedForMember.startSnapshot.riskTier} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-success" />
                Where They Are Now
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Current Goals</p>
                <div className="flex flex-wrap gap-2">
                  {wrappedForMember.currentSnapshot.goals.map((goal, i) => (
                    <Badge key={i} variant="outline">
                      {goal}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Current Challenges</p>
                <div className="flex flex-wrap gap-2">
                  {wrappedForMember.currentSnapshot.bottlenecks.map((b, i) => (
                    <Badge key={i} variant="secondary">
                      {b}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Risk Level:</span>
                <RiskBadge tier={wrappedForMember.currentSnapshot.riskTier} />
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Highlights</CardTitle>
              <CardDescription>Key metrics from their membership</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-5">
                <div className="text-center p-4 rounded-lg bg-muted">
                  <Handshake className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <p className="text-3xl font-bold">{wrappedForMember.highlights.introsReceived}</p>
                  <p className="text-sm text-muted-foreground">Intros Received</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted">
                  <Gift className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <p className="text-3xl font-bold">{wrappedForMember.highlights.perksUsed}</p>
                  <p className="text-sm text-muted-foreground">Perks Used</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted">
                  <Calendar className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <p className="text-3xl font-bold">{wrappedForMember.highlights.eventsAttended}</p>
                  <p className="text-sm text-muted-foreground">Events Attended</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted">
                  <BookOpen className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <p className="text-3xl font-bold">{wrappedForMember.highlights.resourcesAccessed}</p>
                  <p className="text-sm text-muted-foreground">Resources Accessed</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted">
                  {wrappedForMember.highlights.sentimentTrend === "improving" ? (
                    <TrendingUp className="h-8 w-8 mx-auto mb-2 text-success" />
                  ) : wrappedForMember.highlights.sentimentTrend === "declining" ? (
                    <TrendingDown className="h-8 w-8 mx-auto mb-2 text-destructive" />
                  ) : (
                    <BarChart3 className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  )}
                  <p className="text-lg font-bold capitalize">{wrappedForMember.highlights.sentimentTrend}</p>
                  <p className="text-sm text-muted-foreground">Sentiment Trend</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Wins</CardTitle>
              <CardDescription>Notable achievements during membership</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {wrappedForMember.wins.map((win, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 rounded-lg bg-success/10 border border-success/20"
                  >
                    <div className="h-8 w-8 rounded-full bg-success/20 flex items-center justify-center text-success font-bold">
                      {i + 1}
                    </div>
                    <p className="text-sm">{win}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No wrapped data available for this member</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
