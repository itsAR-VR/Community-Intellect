"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Users2, AlertTriangle, Target } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { EmptyState } from "@/components/shared/empty-state"
import { toast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import type { Member, Pod } from "@/lib/types"

export function PodsClient({ members, pods }: { members: Member[]; pods: Pod[] }) {
  const router = useRouter()
  const { canEdit } = useAuth()
  const [createOpen, setCreateOpen] = React.useState(false)
  const [name, setName] = React.useState("")
  const [memberIds, setMemberIds] = React.useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Pods</h1>
          <p className="text-sm text-muted-foreground">Accountability pod management</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto" disabled={!canEdit}>
              Create Pod
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Create Pod</DialogTitle>
              <DialogDescription>Group members into an accountability pod.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Q1 Accountability Pod" />
              </div>
              <div className="space-y-2">
                <Label>Members</Label>
                <div className="grid gap-2 md:grid-cols-2 max-h-[240px] overflow-auto rounded-md border border-border p-3">
                  {members.map((m) => {
                    const checked = memberIds.includes(m.id)
                    return (
                      <label key={m.id} className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(next) => {
                            const isChecked = next === true
                            setMemberIds((prev) =>
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
                disabled={!name || isSubmitting || !canEdit}
                onClick={async () => {
                  setIsSubmitting(true)
                  try {
                    const res = await fetch("/app/api/pods/create", {
                      method: "POST",
                      headers: { "content-type": "application/json" },
                      body: JSON.stringify({ name, memberIds }),
                    })
                    if (!res.ok) throw new Error(await res.text())
                    toast({ title: "Pod created" })
                    setCreateOpen(false)
                    setName("")
                    setMemberIds([])
                    router.refresh()
                  } catch (e) {
                    toast({ title: "Failed to create pod", description: e instanceof Error ? e.message : "Unknown error" })
                  } finally {
                    setIsSubmitting(false)
                  }
                }}
              >
                {isSubmitting ? "Creating..." : "Create Pod"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-3 gap-3 md:gap-4">
        <Card>
          <CardContent className="p-3 md:p-4 md:pt-6">
            <div className="flex items-center gap-2 md:gap-4">
              <div className="rounded-lg bg-primary/10 p-2 md:p-3 shrink-0">
                <Users2 className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xl md:text-2xl font-bold">{pods.length}</p>
                <p className="text-xs md:text-sm text-muted-foreground">Pods</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:p-4 md:pt-6">
            <div className="flex items-center gap-2 md:gap-4">
              <div className="rounded-lg bg-success/10 p-2 md:p-3 shrink-0">
                <Target className="h-4 w-4 md:h-5 md:w-5 text-success" />
              </div>
              <div className="min-w-0">
                <p className="text-xl md:text-2xl font-bold">
                  {pods.filter((p) => p.monthlyGoalsPromptSent && p.monthlyGoalsReceived.length > 0).length}
                </p>
                <p className="text-xs md:text-sm text-muted-foreground">Goals</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:p-4 md:pt-6">
            <div className="flex items-center gap-2 md:gap-4">
              <div className="rounded-lg bg-warning/10 p-2 md:p-3 shrink-0">
                <AlertTriangle className="h-4 w-4 md:h-5 md:w-5 text-warning" />
              </div>
              <div className="min-w-0">
                <p className="text-xl md:text-2xl font-bold">
                  {pods.filter((p) => p.quietMemberIds.length > 0).length}
                </p>
                <p className="text-xs md:text-sm text-muted-foreground">Quiet</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {pods.length === 0 ? (
        <EmptyState
          icon={Users2}
          title="No pods created"
          description="Create accountability pods to help members achieve their goals"
          action={
            <Button onClick={() => setCreateOpen(true)} disabled={!canEdit}>
              Create Pod
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pods.map((pod) => {
            const podMembers = pod.memberIds.map((id) => members.find((m) => m.id === id)).filter(Boolean)
            const quietMembers = pod.quietMemberIds.map((id) => members.find((m) => m.id === id)).filter(Boolean)
            const goalsProgress =
              pod.monthlyGoalsPromptSent && pod.memberIds.length > 0
                ? Math.round((pod.monthlyGoalsReceived.length / pod.memberIds.length) * 100)
                : 0

            return (
              <Card key={pod.id} className={quietMembers.length > 0 ? "border-warning/50" : ""}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base leading-tight">{pod.name}</CardTitle>
                    {quietMembers.length > 0 && (
                      <Badge variant="outline" className="text-warning border-warning/50 shrink-0 text-xs">
                        <AlertTriangle className="mr-1 h-3 w-3" />
                        {quietMembers.length} quiet
                      </Badge>
                    )}
                  </div>
                  <CardDescription>{podMembers.length} members</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex -space-x-2">
                    {podMembers.slice(0, 5).map((member) => (
                      <Avatar
                        key={member?.id}
                        className={`h-8 w-8 border-2 border-background ${
                          pod.quietMemberIds.includes(member?.id ?? "") ? "ring-2 ring-warning" : ""
                        }`}
                      >
                        <AvatarFallback
                          className={`text-xs ${
                            pod.quietMemberIds.includes(member?.id ?? "") ? "bg-warning/20 text-warning" : "bg-muted"
                          }`}
                        >
                          {member?.firstName[0]}
                          {member?.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {podMembers.length > 5 && (
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium border-2 border-background">
                        +{podMembers.length - 5}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Monthly Goals</span>
                      <span>{goalsProgress}%</span>
                    </div>
                    <Progress value={goalsProgress} className="h-2" />
                    {pod.monthlyGoalsPromptSent ? (
                      <p className="text-xs text-muted-foreground">
                        {pod.monthlyGoalsReceived.length}/{pod.memberIds.length} received
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">Prompt not sent</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Receipts</span>
                    <span>{pod.receiptsShared.length}</span>
                  </div>

                  {quietMembers.length > 0 && (
                    <div className="rounded-lg bg-warning/10 p-3">
                      <p className="text-xs font-medium text-warning mb-1">Quiet Members</p>
                      <div className="space-y-1">
                        {quietMembers.slice(0, 2).map((member) => (
                          <Link
                            key={member?.id}
                            href={`/app/members/${member?.id}`}
                            className="text-xs text-warning hover:underline block truncate"
                          >
                            {member?.firstName} {member?.lastName}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  <Button size="sm" className="w-full">
                    Manage Pod
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
