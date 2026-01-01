"use client"
import { useParams } from "next/navigation"
import { Gift, Plus, CheckCircle, Clock, XCircle, Building2, ExternalLink } from "lucide-react"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ImpactScoreBar } from "@/components/shared/impact-score-bar"
import { EmptyState } from "@/components/shared/empty-state"
import { mockMembers, mockPerks, mockPerkRecommendations, mockPerkPartnerApplications } from "@/lib/mock-data"
import type { TenantId, PerkCategory } from "@/lib/types"
import { formatDistanceToNow } from "date-fns"

export default function PerksPage() {
  const params = useParams()
  const tenantId = params.tenantId as TenantId

  const perks = mockPerks.filter((p) => p.tenantId === tenantId && p.active)
  const members = mockMembers.filter((m) => m.tenantId === tenantId)
  const memberIds = members.map((m) => m.id)

  const recommendations = mockPerkRecommendations.filter((r) => memberIds.includes(r.memberId) && !r.dismissed)

  const applications = mockPerkPartnerApplications.filter((a) => a.tenantId === tenantId)

  const categoryLabels: Record<PerkCategory, string> = {
    saas: "SaaS",
    service: "Service",
    event: "Event",
    content: "Content",
    community: "Community",
    discount: "Discount",
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Perks</h1>
          <p className="text-muted-foreground">Manage member perks and partner applications</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Perk
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Perk</DialogTitle>
              <DialogDescription>Create a new perk for club members</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Perk Name</Label>
                <Input placeholder="e.g., AWS Credits" />
              </div>
              <div className="space-y-2">
                <Label>Partner Name</Label>
                <Input placeholder="e.g., Amazon Web Services" />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(categoryLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Value</Label>
                <Input placeholder="e.g., $5,000 credits" />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea placeholder="Describe the perk..." />
              </div>
              <Button className="w-full">Create Perk</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-primary/10 p-3">
                <Gift className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{perks.length}</p>
                <p className="text-sm text-muted-foreground">Active Perks</p>
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
                <p className="text-2xl font-bold">{recommendations.filter((r) => r.deliveredAt).length}</p>
                <p className="text-sm text-muted-foreground">Delivered</p>
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
                <p className="text-2xl font-bold">{recommendations.filter((r) => !r.deliveredAt).length}</p>
                <p className="text-sm text-muted-foreground">Recommended</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-muted p-3">
                <Building2 className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{applications.filter((a) => a.status === "pending").length}</p>
                <p className="text-sm text-muted-foreground">Applications</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="recommendations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="database">Perks Database</TabsTrigger>
          <TabsTrigger value="applications">Partner Applications</TabsTrigger>
        </TabsList>

        <TabsContent value="recommendations" className="space-y-4">
          {recommendations.filter((r) => !r.deliveredAt).length === 0 ? (
            <EmptyState
              icon={Gift}
              title="No perk recommendations"
              description="AI-generated perk recommendations will appear here"
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {recommendations
                .filter((r) => !r.deliveredAt)
                .map((rec) => {
                  const member = mockMembers.find((m) => m.id === rec.memberId)
                  const perk = mockPerks.find((p) => p.id === rec.perkId)
                  if (!member || !perk) return null

                  return (
                    <Card key={rec.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-4">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-muted">
                              {member.firstName[0]}
                              {member.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-medium text-sm">
                              {member.firstName} {member.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground">{member.company.name}</p>
                          </div>
                        </div>
                        <div className="rounded-lg border border-border p-3 mb-3">
                          <div className="flex items-start gap-3">
                            <div className="rounded bg-muted p-2">
                              <Gift className="h-4 w-4" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-sm">{perk.name}</p>
                              <p className="text-xs text-muted-foreground">{perk.partnerName}</p>
                              {perk.value && (
                                <Badge variant="secondary" className="mt-1 text-xs">
                                  {perk.value}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs text-muted-foreground">Impact</span>
                          <ImpactScoreBar score={rec.impactScore} size="sm" />
                        </div>
                        <p className="text-xs text-muted-foreground mb-3">{rec.rationale}</p>
                        <div className="flex gap-2">
                          <Button size="sm" className="flex-1">
                            Send Perk
                          </Button>
                          <Button size="sm" variant="outline" className="bg-transparent">
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

        <TabsContent value="database" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Perks Database</CardTitle>
              <CardDescription>{perks.length} active perks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {perks.map((perk) => (
                  <div
                    key={perk.id}
                    className="flex items-center gap-4 rounded-lg border border-border p-4 hover:bg-accent/30 transition-colors"
                  >
                    <div className="rounded-lg bg-muted p-3">
                      <Gift className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">{perk.name}</p>
                        <Badge variant="outline" className="text-xs">
                          {categoryLabels[perk.category]}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{perk.partnerName}</p>
                      <p className="text-sm text-muted-foreground mt-1">{perk.description}</p>
                    </div>
                    {perk.value && <Badge variant="secondary">{perk.value}</Badge>}
                    {perk.url && (
                      <Button variant="ghost" size="icon" asChild>
                        <a href={perk.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="applications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Partner Applications</CardTitle>
              <CardDescription>Review perk partner applications</CardDescription>
            </CardHeader>
            <CardContent>
              {applications.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No applications</p>
              ) : (
                <div className="space-y-4">
                  {applications.map((app) => (
                    <div
                      key={app.id}
                      className={`rounded-lg border p-4 ${
                        app.status === "pending"
                          ? "border-warning/50 bg-warning/5"
                          : app.status === "approved"
                            ? "border-success/50 bg-success/5"
                            : "border-border"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-medium">{app.companyName}</p>
                          <p className="text-sm text-muted-foreground">
                            {app.contactName} · {app.contactEmail}
                          </p>
                        </div>
                        <Badge
                          variant={
                            app.status === "approved"
                              ? "default"
                              : app.status === "rejected"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {app.status}
                        </Badge>
                      </div>
                      <p className="text-sm mb-4">{app.perkDescription}</p>
                      {app.status === "pending" && (
                        <div className="flex gap-2">
                          <Button size="sm" className="flex-1">
                            <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
                            Approve
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                            <XCircle className="mr-1.5 h-3.5 w-3.5" />
                            Reject
                          </Button>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground mt-3">
                        Applied {formatDistanceToNow(new Date(app.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
