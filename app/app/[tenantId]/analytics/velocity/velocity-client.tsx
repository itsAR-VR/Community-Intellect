"use client"

import Link from "next/link"
import { Target, Trophy, ExternalLink, Plus } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { EmptyState } from "@/components/shared/empty-state"
import type { TenantId, Member } from "@/lib/types"

const mockChallenges = [
  {
    id: "ch_001",
    title: "Q1 Pipeline Challenge",
    theme: "Generate $500K in pipeline by March 31",
    participants: ["mem_001", "mem_004", "mem_006", "mem_008", "mem_010"],
    proofs: [
      { memberId: "mem_001", link: "https://example.com/proof1", description: "$120K closed" },
      { memberId: "mem_004", link: "https://example.com/proof2", description: "$85K pipeline added" },
    ],
    startDate: "2026-01-01",
    endDate: "2026-03-31",
    active: true,
  },
  {
    id: "ch_002",
    title: "Content Creation Sprint",
    theme: "Publish 3 thought leadership pieces",
    participants: ["mem_002", "mem_005", "mem_011", "mem_013"],
    proofs: [{ memberId: "mem_002", link: "https://example.com/article1", description: "LinkedIn article published" }],
    startDate: "2025-12-01",
    endDate: "2025-12-31",
    active: false,
  },
]

export function VelocityClient({ tenantId, members }: { tenantId: TenantId; members: Member[] }) {
  const activeChallenges = mockChallenges.filter((c) => c.active)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Velocity</h1>
          <p className="text-muted-foreground">Challenge tracking and accountability</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Challenge
        </Button>
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
                <p className="text-2xl font-bold">{mockChallenges.reduce((sum, c) => sum + c.proofs.length, 0)}</p>
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
                <p className="text-2xl font-bold">{new Set(mockChallenges.flatMap((c) => c.participants)).size}</p>
                <p className="text-sm text-muted-foreground">Total Participants</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {mockChallenges.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No challenges yet"
          description="Create a challenge to drive member accountability"
          action={
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Challenge
            </Button>
          }
        />
      ) : (
        <div className="space-y-6">
          {mockChallenges.map((challenge) => {
            const participants = challenge.participants.map((id) => members.find((m) => m.id === id)).filter(Boolean)
            const participantsWithProof = new Set(challenge.proofs.map((p) => p.memberId))
            const completionRate = Math.round((participantsWithProof.size / challenge.participants.length) * 100)

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
                        {participantsWithProof.size}/{challenge.participants.length} participants
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
                            href={`/app/${tenantId}/members/${member.id}`}
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

                  {challenge.proofs.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-3">Proof Links</p>
                      <div className="space-y-2">
                        {challenge.proofs.map((proof, i) => {
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
