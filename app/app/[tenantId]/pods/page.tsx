"use client"

import { useParams } from "next/navigation"
import Link from "next/link"
import { Users2, AlertTriangle, Target } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { EmptyState } from "@/components/shared/empty-state"
import { mockMembers, mockPods } from "@/lib/mock-data"
import type { TenantId } from "@/lib/types"

export default function PodsPage() {
  const params = useParams()
  const tenantId = params.tenantId as TenantId

  const pods = mockPods.filter((p) => p.tenantId === tenantId)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Pods</h1>
          <p className="text-sm text-muted-foreground">Accountability pod management</p>
        </div>
        <Button className="w-full sm:w-auto">Create Pod</Button>
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
          action={<Button>Create Pod</Button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pods.map((pod) => {
            const members = pod.memberIds.map((id) => mockMembers.find((m) => m.id === id)).filter(Boolean)
            const quietMembers = pod.quietMemberIds.map((id) => mockMembers.find((m) => m.id === id)).filter(Boolean)
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
                  <CardDescription>{members.length} members</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex -space-x-2">
                    {members.slice(0, 5).map((member) => (
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
                    {members.length > 5 && (
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium border-2 border-background">
                        +{members.length - 5}
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
                            href={`/app/${tenantId}/members/${member?.id}`}
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
