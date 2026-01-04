"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { CheckCircle, Clock, AlertCircle, ChevronLeft, ChevronRight, MessageSquare } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { ActionTypeBadge } from "@/components/shared/action-type-badge"
import { ImpactScoreBar } from "@/components/shared/impact-score-bar"
import { toast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import type { ForcedSuccessItem, Member, ActionType } from "@/lib/types"
import { format, startOfWeek, addWeeks, subWeeks } from "date-fns"

export function ForcedSuccessClient({
  members,
  items,
}: {
  members: Member[]
  items: ForcedSuccessItem[]
}) {
  const router = useRouter()
  const { canEdit } = useAuth()
  const [currentWeek, setCurrentWeek] = React.useState(startOfWeek(new Date(), { weekStartsOn: 1 }))
  const weekString = format(currentWeek, "yyyy-'W'ww")

  const weekItems = items.filter((item) => item.weekOf === weekString)
  const dueItems = weekItems.filter((item) => !item.deliveredAt && !item.blocked)
  const deliveredItems = weekItems.filter((item) => item.deliveredAt)
  const blockedItems = weekItems.filter((item) => item.blocked)

  const complianceRate = weekItems.length > 0 ? Math.round((deliveredItems.length / weekItems.length) * 100) : 0

  const navigateWeek = (direction: "prev" | "next") => {
    setCurrentWeek(direction === "prev" ? subWeeks(currentWeek, 1) : addWeeks(currentWeek, 1))
  }

  const priorityOrder = ["intro", "perk", "resource", "workshop_invite", "check_in"]

  const overrideBlock = async (id: string) => {
    try {
      const res = await fetch("/app/api/forced-success/override-block", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ forcedSuccessId: id }),
      })
      if (!res.ok) throw new Error(await res.text())
      toast({ title: "Block overridden" })
      router.refresh()
    } catch (e) {
      toast({ title: "Failed to override", description: e instanceof Error ? e.message : "Unknown error" })
    }
  }

  const markDelivered = async (id: string, deliveredActionType?: ActionType) => {
    try {
      const res = await fetch("/app/api/forced-success/mark-delivered", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ forcedSuccessId: id, deliveredActionType }),
      })
      if (!res.ok) throw new Error(await res.text())
      toast({ title: "Marked delivered" })
      router.refresh()
    } catch (e) {
      toast({ title: "Failed to mark delivered", description: e instanceof Error ? e.message : "Unknown error" })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Forced Success</h1>
          <p className="text-muted-foreground">Weekly value guarantee tracking</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigateWeek("prev")}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="px-4 py-2 rounded-md border border-border bg-card">
            <span className="font-medium">
              {format(currentWeek, "MMM d")} - {format(addWeeks(currentWeek, 1), "MMM d, yyyy")}
            </span>
          </div>
          <Button variant="outline" size="icon" onClick={() => navigateWeek("next")}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Compliance Rate</p>
            <p className="text-2xl font-bold">{complianceRate}%</p>
          </div>
          <div className="w-32">
            <Progress value={complianceRate} className="h-3" />
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-warning/10 p-3">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{dueItems.length}</p>
                <p className="text-sm text-muted-foreground">Due This Week</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-success/10 p-3">
                <CheckCircle className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{deliveredItems.length}</p>
                <p className="text-sm text-muted-foreground">Delivered</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-destructive/10 p-3">
                <AlertCircle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{blockedItems.length}</p>
                <p className="text-sm text-muted-foreground">Blocked</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-warning" />
              Due This Week
            </CardTitle>
            <CardDescription>{dueItems.length} members need value drops</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dueItems.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">All caught up!</p>
              ) : (
                dueItems.map((item) => {
                  const member = members.find((m) => m.id === item.memberId)
                  if (!member) return null
                  const topAction = item.recommendedActions.sort((a, b) => {
                    const aIndex = priorityOrder.indexOf(a.type)
                    const bIndex = priorityOrder.indexOf(b.type)
                    return aIndex - bIndex
                  })[0]

                  return (
                    <div key={item.id} className="rounded-lg border border-border p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-muted text-xs">
                            {member.firstName[0]}
                            {member.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/app/members/${member.id}`}
                            className="font-medium text-sm hover:underline"
                          >
                            {member.firstName} {member.lastName}
                          </Link>
                        </div>
                      </div>
                      {topAction && (
                        <div className="flex items-center justify-between">
                          <ActionTypeBadge type={topAction.type} size="sm" />
                          <ImpactScoreBar score={topAction.impactScore} size="sm" />
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button size="sm" className="flex-1" disabled={!canEdit}>
                          <MessageSquare className="mr-1.5 h-3.5 w-3.5" />
                          Create Draft
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 bg-transparent"
                          disabled={!canEdit}
                          onClick={() => void markDelivered(item.id, topAction?.type)}
                        >
                          Mark Delivered
                        </Button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-success" />
              Delivered
            </CardTitle>
            <CardDescription>{deliveredItems.length} value drops completed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {deliveredItems.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No deliveries yet</p>
              ) : (
                deliveredItems.map((item) => {
                  const member = members.find((m) => m.id === item.memberId)
                  if (!member) return null

                  return (
                    <div key={item.id} className="rounded-lg border border-border p-3 bg-success/5">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-success/20 text-success text-xs">
                            {member.firstName[0]}
                            {member.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <Link href={`/app/members/${member.id}`} className="font-medium text-sm hover:underline">
                            {member.firstName} {member.lastName}
                          </Link>
                          <div className="flex items-center gap-2 mt-1">
                            {item.deliveredActionType && <ActionTypeBadge type={item.deliveredActionType} size="sm" />}
                          </div>
                        </div>
                        <CheckCircle className="h-5 w-5 text-success" />
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Blocked
            </CardTitle>
            <CardDescription>{blockedItems.length} items need attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {blockedItems.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No blocked items</p>
              ) : (
                blockedItems.map((item) => {
                  const member = members.find((m) => m.id === item.memberId)
                  if (!member) return null

                  return (
                    <div key={item.id} className="rounded-lg border border-destructive/30 p-3 bg-destructive/5">
                      <div className="flex items-center gap-2 mb-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-destructive/20 text-destructive text-xs">
                            {member.firstName[0]}
                            {member.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <Link href={`/app/members/${member.id}`} className="font-medium text-sm hover:underline">
                            {member.firstName} {member.lastName}
                          </Link>
                        </div>
                      </div>
                      <p className="text-xs text-destructive mb-2">{item.blockedReason}</p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full bg-transparent"
                        disabled={!canEdit}
                        onClick={() => void overrideBlock(item.id)}
                      >
                        Override Block
                      </Button>
                    </div>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
