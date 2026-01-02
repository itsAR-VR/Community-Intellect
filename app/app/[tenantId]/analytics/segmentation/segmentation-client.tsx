"use client"

import Link from "next/link"
import { Layers, Users, Lightbulb } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/shared/empty-state"
import type { TenantId, Member, PersonaCluster } from "@/lib/types"

export function SegmentationClient({
  tenantId,
  members,
  clusters,
}: {
  tenantId: TenantId
  members: Member[]
  clusters: PersonaCluster[]
}) {

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Segmentation</h1>
          <p className="text-muted-foreground">AI-generated persona clusters</p>
        </div>
        <Button>Regenerate Clusters</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-primary/10 p-3">
                <Layers className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{clusters.length}</p>
                <p className="text-sm text-muted-foreground">Persona Clusters</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-muted p-3">
                <Users className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{members.length}</p>
                <p className="text-sm text-muted-foreground">Total Members</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {clusters.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No clusters generated"
          description="Generate persona clusters to better understand your members"
          action={<Button>Generate Clusters</Button>}
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {clusters.map((cluster) => {
            const clusterMembers = cluster.memberIds.map((id) => members.find((m) => m.id === id)).filter(Boolean)

            return (
              <Card key={cluster.id}>
                <CardHeader>
                  <CardTitle>{cluster.name}</CardTitle>
                  <CardDescription>{cluster.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Characteristics</p>
                    <div className="flex flex-wrap gap-1.5">
                      {cluster.characteristics.map((char, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {char}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Members ({clusterMembers.length})</p>
                    <div className="flex -space-x-2">
                      {clusterMembers.slice(0, 8).map((member) => (
                        <Link key={member?.id} href={`/app/${tenantId}/members/${member?.id}`}>
                          <Avatar className="h-8 w-8 border-2 border-background hover:z-10 transition-transform hover:scale-110">
                            <AvatarFallback className="text-xs bg-muted">
                              {member?.firstName[0]}
                              {member?.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                        </Link>
                      ))}
                      {clusterMembers.length > 8 && (
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium border-2 border-background">
                          +{clusterMembers.length - 8}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="h-4 w-4 text-primary" />
                      <p className="text-sm font-medium">Suggested Uses</p>
                    </div>
                    <ul className="space-y-1">
                      {cluster.suggestedUses.map((use, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-primary">•</span>
                          {use}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Button variant="outline" className="w-full bg-transparent">
                    View All Members
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
