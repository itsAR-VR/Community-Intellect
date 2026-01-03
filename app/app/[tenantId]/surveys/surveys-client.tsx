"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ClipboardList, Send, CheckCircle, AlertCircle, TrendingUp, TrendingDown } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { EmptyState } from "@/components/shared/empty-state"
import { toast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import type { TenantId, Member, Survey } from "@/lib/types"
import { formatDistanceToNow } from "date-fns"

export function SurveysClient({ tenantId, members, surveys }: { tenantId: TenantId; members: Member[]; surveys: Survey[] }) {
  const router = useRouter()
  const { canEdit } = useAuth()

  const [sendOpen, setSendOpen] = React.useState(false)
  const [selectedMemberIds, setSelectedMemberIds] = React.useState<string[]>([])
  const [cadence, setCadence] = React.useState<Survey["cadence"]>("quarterly")
  const [isSending, setIsSending] = React.useState(false)

  const send = async (memberIds: string[]) => {
    setIsSending(true)
    try {
      const res = await fetch("/app/api/surveys/send", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tenantId, memberIds, cadence }),
      })
      if (!res.ok) throw new Error(await res.text())
      toast({ title: "Survey sent" })
      router.refresh()
    } catch (e) {
      toast({ title: "Failed to send survey", description: e instanceof Error ? e.message : "Unknown error" })
    } finally {
      setIsSending(false)
    }
  }

  const completedRecently = surveys.filter((s) => {
    if (!s.lastCompletedAt) return false
    const completedDate = new Date(s.lastCompletedAt)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    return completedDate >= sevenDaysAgo
  })

  const needsFollowUp = surveys.filter((s) => {
    const hasNegative = s.responses.some((r) => r.sentiment === "negative")
    return hasNegative
  })

  const averageCompletion =
    surveys.length > 0 ? Math.round(surveys.reduce((sum, s) => sum + s.completionRate, 0) / surveys.length) : 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Surveys</h1>
          <p className="text-sm text-muted-foreground">Track member sentiment and gather feedback</p>
        </div>
        <Dialog open={sendOpen} onOpenChange={setSendOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto" disabled={!canEdit}>
              <Send className="mr-2 h-4 w-4" />
              Send Survey
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Send Survey</DialogTitle>
              <DialogDescription>Select members and a cadence. This records a send event in the system.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Cadence</Label>
                <Select value={cadence} onValueChange={(v) => setCadence(v as Survey["cadence"])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="biweekly">Biweekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Members</Label>
                <div className="grid gap-2 md:grid-cols-2 max-h-[260px] overflow-auto rounded-md border border-border p-3">
                  {members.map((m) => {
                    const checked = selectedMemberIds.includes(m.id)
                    return (
                      <label key={m.id} className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(next) => {
                            const isChecked = next === true
                            setSelectedMemberIds((prev) =>
                              isChecked ? Array.from(new Set([...prev, m.id])) : prev.filter((id) => id !== m.id),
                            )
                          }}
                        />
                        <span className="truncate">
                          {m.firstName} {m.lastName} — {m.company.name}
                        </span>
                      </label>
                    )
                  })}
                </div>
              </div>

              <Button
                disabled={selectedMemberIds.length === 0 || isSending || !canEdit}
                onClick={async () => {
                  await send(selectedMemberIds)
                  setSendOpen(false)
                  setSelectedMemberIds([])
                }}
              >
                {isSending ? "Sending..." : `Send to ${selectedMemberIds.length}`}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Card>
          <CardContent className="p-4 md:pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2.5 shrink-0">
                <ClipboardList className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xl md:text-2xl font-bold">{surveys.length}</p>
                <p className="text-xs md:text-sm text-muted-foreground">Surveys</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 md:pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-success/10 p-2.5 shrink-0">
                <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-success" />
              </div>
              <div className="min-w-0">
                <p className="text-xl md:text-2xl font-bold">{completedRecently.length}</p>
                <p className="text-xs md:text-sm text-muted-foreground">Done (7d)</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 md:pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-warning/10 p-2.5 shrink-0">
                <AlertCircle className="h-4 w-4 md:h-5 md:w-5 text-warning" />
              </div>
              <div className="min-w-0">
                <p className="text-xl md:text-2xl font-bold">{needsFollowUp.length}</p>
                <p className="text-xs md:text-sm text-muted-foreground">Follow-up</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 md:pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-muted p-2.5 shrink-0">
                <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-xl md:text-2xl font-bold">{averageCompletion}%</p>
                <p className="text-xs md:text-sm text-muted-foreground">Avg Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {surveys.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No surveys yet"
          description="Start sending surveys to gather member feedback"
          action={
            <Button onClick={() => setSendOpen(true)} disabled={!canEdit}>
              <Send className="mr-2 h-4 w-4" />
              Send Survey
            </Button>
          }
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Survey Status</CardTitle>
            <CardDescription>Member survey completion and responses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {surveys.map((survey) => {
                const member = members.find((m) => m.id === survey.memberId)
                if (!member) return null

                const hasNegative = survey.responses.some((r) => r.sentiment === "negative")
                const hasPositive = survey.responses.some((r) => r.sentiment === "positive")

                return (
                  <div
                    key={survey.id}
                    className={`rounded-lg border p-3 md:p-4 ${
                      hasNegative ? "border-warning/50 bg-warning/5" : "border-border"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      {/* Member info */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <Avatar className="h-9 w-9 shrink-0">
                          <AvatarFallback className="bg-muted text-sm">
                            {member.firstName[0]}
                            {member.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Link
                              href={`/app/${tenantId}/members/${member.id}`}
                              className="font-medium text-sm hover:underline"
                            >
                              {member.firstName} {member.lastName}
                            </Link>
                            <Badge variant="outline" className="text-xs capitalize shrink-0">
                              {survey.cadence}
                            </Badge>
                            {hasNegative && (
                              <Badge variant="outline" className="text-warning border-warning/50 text-xs shrink-0">
                                <TrendingDown className="mr-1 h-3 w-3" />
                                Negative
                              </Badge>
                            )}
                            {hasPositive && !hasNegative && (
                              <Badge variant="outline" className="text-success border-success/50 text-xs shrink-0">
                                <TrendingUp className="mr-1 h-3 w-3" />
                                Positive
                              </Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mt-1">
                            <span>
                              {survey.lastCompletedAt
                                ? formatDistanceToNow(new Date(survey.lastCompletedAt), { addSuffix: true })
                                : "Never completed"}
                            </span>
                            <span>{survey.completionRate}% rate</span>
                          </div>
                        </div>
                      </div>

                      {/* Actions - stack on mobile */}
                      <div className="flex items-center gap-2 sm:gap-3 mt-2 sm:mt-0">
                        <Progress value={survey.completionRate} className="h-2 w-16 hidden sm:block" />
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="bg-transparent flex-1 sm:flex-none">
                              View
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-lg">
                            <DialogHeader>
                              <DialogTitle>Survey Responses</DialogTitle>
                              <DialogDescription>
                                {member.firstName} {member.lastName}&apos;s latest responses
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4 max-h-[400px] overflow-y-auto">
                              {survey.responses.length === 0 ? (
                                <p className="text-center text-muted-foreground py-4">No responses yet</p>
                              ) : (
                                survey.responses.map((response, i) => (
                                  <div key={i} className="rounded-lg border border-border p-3">
                                    <p className="text-sm font-medium mb-2">{response.question}</p>
                                    <p className="text-sm">{response.answer}</p>
                                    {response.sentiment && (
                                      <Badge
                                        variant="outline"
                                        className={`mt-2 text-xs ${
                                          response.sentiment === "negative"
                                            ? "text-warning border-warning/50"
                                            : response.sentiment === "positive"
                                              ? "text-success border-success/50"
                                              : ""
                                        }`}
                                      >
                                        {response.sentiment}
                                      </Badge>
                                    )}
                                    {response.deltaSinceLast && (
                                      <p className="text-xs text-muted-foreground mt-2">
                                        Change: {response.deltaSinceLast}
                                      </p>
                                    )}
                                  </div>
                                ))
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button
                          size="sm"
                          className="flex-1 sm:flex-none"
                          disabled={!canEdit || isSending}
                          onClick={() => void send([member.id])}
                        >
                          Send
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
