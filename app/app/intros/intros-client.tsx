"use client"
import * as React from "react"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { Handshake, CheckCircle, Clock, MessageSquare, Star } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ImpactScoreBar } from "@/components/shared/impact-score-bar"
import { EmptyState } from "@/components/shared/empty-state"
import { toast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import type { Member, IntroSuggestion, IntroRecord } from "@/lib/types"
import { formatDistanceToNow } from "date-fns"

export function IntrosClient({
  members,
  introSuggestions,
  introRecords,
}: {
  members: Member[]
  introSuggestions: IntroSuggestion[]
  introRecords: IntroRecord[]
}) {
  const router = useRouter()
  const { canEdit } = useAuth()
  const [createOpen, setCreateOpen] = React.useState(false)
  const [memberAId, setMemberAId] = React.useState<string>("")
  const [memberBId, setMemberBId] = React.useState<string>("")
  const [rationale, setRationale] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const memberIds = members.map((m) => m.id)

  const suggestions = introSuggestions.filter(
    (s) => !s.dismissed && (memberIds.includes(s.memberAId) || memberIds.includes(s.memberBId)),
  )

  const records = introRecords.filter((r) => memberIds.includes(r.memberAId) || memberIds.includes(r.memberBId))

  const newMembers = members.filter((m) => {
    const joinedDate = new Date(m.joinedAt)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    return joinedDate >= thirtyDaysAgo
  })

  const pendingOutcomes = records.filter((r) => r.status === "completed" && (!r.outcomeA || !r.outcomeB))

  const createIntro = async () => {
    if (!memberAId || !memberBId || memberAId === memberBId) {
      toast({ title: "Select two different members" })
      return
    }
    if (!rationale.trim()) {
      toast({ title: "Add a rationale" })
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch("/app/api/intros/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ memberAId, memberBId, rationale }),
      })
      if (!res.ok) throw new Error(await res.text())
      toast({ title: "Intro created" })
      setCreateOpen(false)
      setMemberAId("")
      setMemberBId("")
      setRationale("")
      router.refresh()
    } catch (e) {
      toast({ title: "Failed to create", description: e instanceof Error ? e.message : "Unknown error" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const dismissSuggestion = async (suggestionId: string) => {
    setIsSubmitting(true)
    try {
      const res = await fetch("/app/api/intros/dismiss-suggestion", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ suggestionId }),
      })
      if (!res.ok) throw new Error(await res.text())
      toast({ title: "Suggestion dismissed" })
      router.refresh()
    } catch (e) {
      toast({ title: "Failed to dismiss", description: e instanceof Error ? e.message : "Unknown error" })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Intros</h1>
          <p className="text-muted-foreground">Facilitate valuable member connections</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button disabled={!canEdit}>
              <Handshake className="mr-2 h-4 w-4" />
              Create Intro
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Intro</DialogTitle>
              <DialogDescription>Connect two members who could benefit from knowing each other</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Member A</Label>
                <Select value={memberAId} onValueChange={setMemberAId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select member" />
                  </SelectTrigger>
                  <SelectContent>
                    {members.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.firstName} {m.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Member B</Label>
                <Select value={memberBId} onValueChange={setMemberBId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select member" />
                  </SelectTrigger>
                  <SelectContent>
                    {members.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.firstName} {m.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Rationale</Label>
                <Textarea value={rationale} onChange={(e) => setRationale(e.target.value)} placeholder="Why should these members connect?" />
              </div>
              <Button className="w-full" onClick={() => void createIntro()} disabled={!canEdit || isSubmitting}>
                Create Introduction
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-primary/10 p-3">
                <Handshake className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{suggestions.length}</p>
                <p className="text-sm text-muted-foreground">Suggestions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-warning/10 p-3">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{records.filter((r) => r.status === "pending").length}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
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
                <p className="text-2xl font-bold">{records.filter((r) => r.status === "completed").length}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-muted p-3">
                <Star className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingOutcomes.length}</p>
                <p className="text-sm text-muted-foreground">Awaiting Outcome</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="suggestions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
          <TabsTrigger value="new-members">New Member Fast-Start</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="outcomes">Pending Outcomes</TabsTrigger>
        </TabsList>

        <TabsContent value="suggestions" className="space-y-4">
          {suggestions.length === 0 ? (
            <EmptyState
              icon={Handshake}
              title="No intro suggestions"
              description="AI-generated intro suggestions will appear here"
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {suggestions.map((suggestion) => {
                    const memberA = members.find((m) => m.id === suggestion.memberAId)
                    const memberB = members.find((m) => m.id === suggestion.memberBId)
                    if (!memberA || !memberB) return null

                return (
                  <Card key={suggestion.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-muted text-sm">
                              {memberA.firstName[0]}
                              {memberA.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <Handshake className="h-4 w-4 text-muted-foreground" />
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-muted text-sm">
                              {memberB.firstName[0]}
                              {memberB.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        <ImpactScoreBar score={suggestion.impactScore} />
                      </div>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <Link
                            href={`/app/members/${memberA.id}`}
                            className="font-medium text-sm hover:underline"
                          >
                            {memberA.firstName} {memberA.lastName}
                          </Link>
                          <p className="text-xs text-muted-foreground">{memberA.company.name}</p>
                        </div>
                        <div className="text-right">
                          <Link
                            href={`/app/members/${memberB.id}`}
                            className="font-medium text-sm hover:underline"
                          >
                            {memberB.firstName} {memberB.lastName}
                          </Link>
                          <p className="text-xs text-muted-foreground">{memberB.company.name}</p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">{suggestion.rationale}</p>
                      <div className="flex gap-2">
                        <Button size="sm" className="flex-1" disabled={!canEdit || isSubmitting}>
                          <MessageSquare className="mr-1.5 h-3.5 w-3.5" />
                          Create Intro
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-transparent"
                          disabled={!canEdit || isSubmitting}
                          onClick={() => void dismissSuggestion(suggestion.id)}
                        >
                          Dismiss
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="new-members" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>New Member Fast-Start</CardTitle>
              <CardDescription>New members in the last 30 days - recommend 3 intros each</CardDescription>
            </CardHeader>
            <CardContent>
              {newMembers.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No new members in the last 30 days</p>
              ) : (
                <div className="space-y-4">
                  {newMembers.map((member) => {
                    const memberSuggestions = suggestions.filter(
                      (s) => s.memberAId === member.id || s.memberBId === member.id,
                    )

                    return (
                      <div key={member.id} className="rounded-lg border border-border p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {member.firstName[0]}
                              {member.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <Link
                              href={`/app/members/${member.id}`}
                              className="font-medium hover:underline"
                            >
                              {member.firstName} {member.lastName}
                            </Link>
                            <p className="text-sm text-muted-foreground">
                              {member.company.role} at {member.company.name}
                            </p>
                          </div>
                          <Badge variant="secondary">{memberSuggestions.length}/3 intros suggested</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Joined {formatDistanceToNow(new Date(member.joinedAt), { addSuffix: true })}
                        </p>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Intro History</CardTitle>
            </CardHeader>
            <CardContent>
              {records.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No intro history</p>
              ) : (
                <div className="space-y-3">
                  {records.map((record) => {
                    const memberA = members.find((m) => m.id === record.memberAId)
                    const memberB = members.find((m) => m.id === record.memberBId)
                    if (!memberA || !memberB) return null

                    return (
                      <div key={record.id} className="flex items-center gap-4 rounded-lg border border-border p-3">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {memberA.firstName[0]}
                              {memberA.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <Handshake className="h-3 w-3 text-muted-foreground" />
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {memberB.firstName[0]}
                              {memberB.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm">
                            {memberA.firstName} {memberA.lastName} — {memberB.firstName} {memberB.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(record.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                        <Badge
                          variant={
                            record.status === "completed"
                              ? "default"
                              : record.status === "declined"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {record.status}
                        </Badge>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="outcomes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Outcomes</CardTitle>
              <CardDescription>Completed intros awaiting feedback</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingOutcomes.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No pending outcomes</p>
              ) : (
                <div className="space-y-3">
                  {pendingOutcomes.map((record) => {
                    const memberA = members.find((m) => m.id === record.memberAId)
                    const memberB = members.find((m) => m.id === record.memberBId)
                    if (!memberA || !memberB) return null

                    return (
                      <div key={record.id} className="rounded-lg border border-border p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {memberA.firstName[0]}
                              {memberA.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <Handshake className="h-3 w-3 text-muted-foreground" />
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {memberB.firstName[0]}
                              {memberB.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="text-sm font-medium">
                              {memberA.firstName} — {memberB.firstName}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                            Request Feedback
                          </Button>
                          <Button size="sm" className="flex-1">
                            Record Outcome
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
