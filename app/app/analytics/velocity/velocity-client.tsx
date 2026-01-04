"use client"

import * as React from "react"
import Link from "next/link"
import { Target, Trophy, ExternalLink, Plus } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import { EmptyState } from "@/components/shared/empty-state"
import type { Member, VelocityChallenge, VelocityProof } from "@/lib/types"
import { useRouter } from "next/navigation"

export function VelocityClient({
  members,
  challenges,
  proofs,
}: {
  members: Member[]
  challenges: VelocityChallenge[]
  proofs: VelocityProof[]
}) {
  const router = useRouter()
  const { canEdit } = useAuth()

  const activeChallenges = challenges.filter((c) => c.active)
  const participantCount = new Set(challenges.flatMap((c) => c.participantIds)).size

  const [createOpen, setCreateOpen] = React.useState(false)
  const [title, setTitle] = React.useState("")
  const [theme, setTheme] = React.useState("")
  const [startDate, setStartDate] = React.useState(() => new Date().toISOString().slice(0, 10))
  const [endDate, setEndDate] = React.useState(() => new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().slice(0, 10))
  const [selectedParticipantIds, setSelectedParticipantIds] = React.useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const [proofOpenFor, setProofOpenFor] = React.useState<string | null>(null)
  const [proofMemberId, setProofMemberId] = React.useState<string>("")
  const [proofLink, setProofLink] = React.useState<string>("")
  const [proofDescription, setProofDescription] = React.useState<string>("")
  const [isProofSubmitting, setIsProofSubmitting] = React.useState(false)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Velocity</h1>
          <p className="text-muted-foreground">Challenge tracking and accountability</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button disabled={!canEdit}>
              <Plus className="mr-2 h-4 w-4" />
              Create Challenge
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Challenge</DialogTitle>
              <DialogDescription>Set a goal and invite members to participate.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Q1 Pipeline Challenge" />
                </div>
                <div className="space-y-2">
                  <Label>Theme</Label>
                  <Input value={theme} onChange={(e) => setTheme(e.target.value)} placeholder="e.g., Generate $500K pipeline by Mar 31" />
                </div>
                <div className="space-y-2">
                  <Label>Start date</Label>
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>End date</Label>
                  <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Participants</Label>
                <div className="grid gap-2 md:grid-cols-2 max-h-[240px] overflow-auto rounded-md border border-border p-3">
                  {members.map((m) => {
                    const checked = selectedParticipantIds.includes(m.id)
                    return (
                      <label key={m.id} className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(next) => {
                            const isChecked = next === true
                            setSelectedParticipantIds((prev) =>
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
                disabled={!title || !theme || !startDate || !endDate || isSubmitting || !canEdit}
                onClick={async () => {
                  setIsSubmitting(true)
                  try {
                    const res = await fetch("/app/api/velocity/challenges/create", {
                      method: "POST",
                      headers: { "content-type": "application/json" },
                      body: JSON.stringify({
                        title,
                        theme,
                        startDate,
                        endDate,
                        participantIds: selectedParticipantIds,
                        active: true,
                      }),
                    })
                    if (!res.ok) throw new Error(await res.text())
                    toast({ title: "Challenge created" })
                    setCreateOpen(false)
                    setTitle("")
                    setTheme("")
                    setSelectedParticipantIds([])
                    router.refresh()
                  } catch (e) {
                    toast({ title: "Failed to create challenge", description: e instanceof Error ? e.message : "Unknown error" })
                  } finally {
                    setIsSubmitting(false)
                  }
                }}
              >
                {isSubmitting ? "Creating..." : "Create Challenge"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-primary/10 p-3">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeChallenges.length}</p>
                <p className="text-sm text-muted-foreground">Active Challenges</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-success/10 p-3">
                <Trophy className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{proofs.length}</p>
                <p className="text-sm text-muted-foreground">Proofs Submitted</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-muted p-3">
                <Target className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{participantCount}</p>
                <p className="text-sm text-muted-foreground">Total Participants</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {challenges.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No challenges yet"
          description="Create a challenge to drive member accountability"
          action={
            <Button onClick={() => setCreateOpen(true)} disabled={!canEdit}>
              <Plus className="mr-2 h-4 w-4" />
              Create Challenge
            </Button>
          }
        />
      ) : (
        <div className="space-y-6">
          {challenges.map((challenge) => {
            const participants = challenge.participantIds.map((id) => members.find((m) => m.id === id)).filter(Boolean)
            const challengeProofs = proofs.filter((p) => p.challengeId === challenge.id)
            const participantsWithProof = new Set(challengeProofs.map((p) => p.memberId))
            const completionRate =
              challenge.participantIds.length > 0 ? Math.round((participantsWithProof.size / challenge.participantIds.length) * 100) : 0

            return (
              <Card key={challenge.id} className={challenge.active ? "border-primary/50" : ""}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {challenge.title}
                        {challenge.active && <Badge>Active</Badge>}
                      </CardTitle>
                      <CardDescription>{challenge.theme}</CardDescription>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{completionRate}%</p>
                      <p className="text-sm text-muted-foreground">Completion</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Progress</span>
                      <span>
                        {participantsWithProof.size}/{challenge.participantIds.length} participants
                      </span>
                    </div>
                    <Progress value={completionRate} className="h-2" />
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-3">Participants</p>
                    <div className="flex flex-wrap gap-2">
                      {participants.map((member) => {
                        if (!member) return null
                        const hasProof = participantsWithProof.has(member.id)

                        return (
                          <Link
                            key={member.id}
                            href={`/app/members/${member.id}`}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-colors ${
                              hasProof
                                ? "bg-success/10 border-success/30 text-success"
                                : "bg-muted border-border hover:bg-accent"
                            }`}
                          >
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs">
                                {member.firstName[0]}
                                {member.lastName[0]}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{member.firstName}</span>
                            {hasProof && <Trophy className="h-3 w-3" />}
                          </Link>
                        )
                      })}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">Proof Links</p>
                    <Dialog open={proofOpenFor === challenge.id} onOpenChange={(open) => setProofOpenFor(open ? challenge.id : null)}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" className="bg-transparent" disabled={!canEdit}>
                          <Plus className="mr-1.5 h-3.5 w-3.5" />
                          Add Proof
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Proof</DialogTitle>
                          <DialogDescription>Attach a link and short description for a member’s proof.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                          <div className="space-y-2">
                            <Label>Member ID</Label>
                            <Input value={proofMemberId} onChange={(e) => setProofMemberId(e.target.value)} placeholder="mem_..." />
                            <p className="text-xs text-muted-foreground">Tip: copy from a member profile URL.</p>
                          </div>
                          <div className="space-y-2">
                            <Label>Link</Label>
                            <Input value={proofLink} onChange={(e) => setProofLink(e.target.value)} placeholder="https://..." />
                          </div>
                          <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea value={proofDescription} onChange={(e) => setProofDescription(e.target.value)} placeholder="e.g., $120K closed" />
                          </div>
                          <Button
                            disabled={!proofMemberId || !proofLink || !proofDescription || isProofSubmitting || !canEdit}
                            onClick={async () => {
                              setIsProofSubmitting(true)
                              try {
                                const res = await fetch("/app/api/velocity/proofs/create", {
                                  method: "POST",
                                  headers: { "content-type": "application/json" },
                                  body: JSON.stringify({
                                    challengeId: challenge.id,
                                    memberId: proofMemberId,
                                    link: proofLink,
                                    description: proofDescription,
                                  }),
                                })
                                if (!res.ok) throw new Error(await res.text())
                                toast({ title: "Proof added" })
                                setProofMemberId("")
                                setProofLink("")
                                setProofDescription("")
                                setProofOpenFor(null)
                                router.refresh()
                              } catch (e) {
                                toast({ title: "Failed to add proof", description: e instanceof Error ? e.message : "Unknown error" })
                              } finally {
                                setIsProofSubmitting(false)
                              }
                            }}
                          >
                            {isProofSubmitting ? "Saving..." : "Add Proof"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {challengeProofs.length > 0 && (
                    <div>
                      <div className="space-y-2">
                        {challengeProofs.map((proof, i) => {
                          const member = members.find((m) => m.id === proof.memberId)
                          return (
                            <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-muted">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-xs">
                                  {member?.firstName[0]}
                                  {member?.lastName[0]}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm flex-1">{proof.description}</span>
                              <a
                                href={proof.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline flex items-center gap-1 text-sm"
                              >
                                View
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
