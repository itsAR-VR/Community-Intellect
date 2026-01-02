"use client"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Mail,
  Linkedin,
  MessageSquare,
  Handshake,
  Gift,
  Target,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ExternalLink,
  Phone,
  Pencil,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { RiskBadge } from "@/components/shared/risk-badge"
import { StatusBadge } from "@/components/shared/status-badge"
import { SourceBadge } from "@/components/shared/source-badge"
import { ActionTypeBadge } from "@/components/shared/action-type-badge"
import { ImpactScoreBar } from "@/components/shared/impact-score-bar"
import type {
  TenantId,
  Member,
  Fact,
  ExternalSignal,
  OpportunityItem,
  MessageDraft,
  IntroSuggestion,
  IntroRecord,
  PerkRecommendation,
  Perk,
  OutcomeFeedback,
} from "@/lib/types"
import { formatDistanceToNow, format } from "date-fns"

export function MemberProfileClient({
  tenantId,
  tenantMembers,
  member,
  facts,
  signals,
  opportunities,
  drafts,
  introSuggestions,
  introRecords,
  perkRecommendations,
  perks,
  outcomes,
}: {
  tenantId: TenantId
  tenantMembers: Member[]
  member: Member | null
  facts: Fact[]
  signals: ExternalSignal[]
  opportunities: OpportunityItem[]
  drafts: MessageDraft[]
  introSuggestions: IntroSuggestion[]
  introRecords: IntroRecord[]
  perkRecommendations: PerkRecommendation[]
  perks: Perk[]
  outcomes: OutcomeFeedback[]
}) {
  const router = useRouter()
  if (!member) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Member not found</p>
      </div>
    )
  }

  const memberId = member.id
  const visibleOpportunities = opportunities.filter((o) => !o.dismissed)
  const visibleIntroSuggestions = introSuggestions.filter((i) => !i.dismissed)
  const visiblePerkRecommendations = perkRecommendations.filter((p) => !p.dismissed)

  const onboardingProgress =
    [
      member.onboarding.intakeCompleted,
      member.onboarding.welcomeCallCompleted,
      member.onboarding.introPackDelivered,
      member.onboarding.profileVerified,
    ].filter(Boolean).length * 25

  const daysUntilRenewal = member.renewalDate
    ? Math.ceil((new Date(member.renewalDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  const factsByCategory = facts.reduce(
    (acc, fact) => {
      if (!acc[fact.category]) acc[fact.category] = []
      acc[fact.category].push(fact)
      return acc
    },
    {} as Record<string, typeof facts>,
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">
            {member.firstName} {member.lastName}
          </h1>
          <p className="text-muted-foreground">
            {member.company.role} at {member.company.name}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3 space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-6">
                <Avatar className="h-20 w-20">
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                    {member.firstName[0]}
                    {member.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-3">
                    <StatusBadge status={member.status} />
                    <RiskBadge tier={member.riskTier} score={member.riskScore} />
                    {member.contactState === "closed" && <Badge variant="secondary">Conversation Closed</Badge>}
                    {member.contactState === "muted" && <Badge variant="outline">Muted</Badge>}
                  </div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Company</p>
                      <p className="font-medium">{member.company.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {member.company.stage} · {member.company.headcount} employees
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Engagement Score</p>
                      <div className="flex items-center gap-2">
                        <p className="text-2xl font-bold">{member.engagementScore}</p>
                        <Progress value={member.engagementScore} className="flex-1 h-2" />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Renewal</p>
                      {daysUntilRenewal !== null ? (
                        <>
                          <p className="text-2xl font-bold">{daysUntilRenewal}d</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(member.renewalDate!), "MMM d, yyyy")}
                          </p>
                        </>
                      ) : (
                        <p className="text-muted-foreground">—</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <a href={`mailto:${member.email}`}>
                        <Mail className="mr-1.5 h-3.5 w-3.5" />
                        Email
                      </a>
                    </Button>
                    {member.linkedInUrl && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={member.linkedInUrl} target="_blank" rel="noopener noreferrer">
                          <Linkedin className="mr-1.5 h-3.5 w-3.5" />
                          LinkedIn
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="truth" className="space-y-4">
            <TabsList className="grid grid-cols-7 w-full">
              <TabsTrigger value="truth">Truth</TabsTrigger>
              <TabsTrigger value="signals">Signals</TabsTrigger>
              <TabsTrigger value="actions">Actions</TabsTrigger>
              <TabsTrigger value="drafts">Drafts</TabsTrigger>
              <TabsTrigger value="intros">Intros</TabsTrigger>
              <TabsTrigger value="perks">Perks</TabsTrigger>
              <TabsTrigger value="outcomes">Outcomes</TabsTrigger>
            </TabsList>

            <TabsContent value="truth" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Truth Profile</CardTitle>
                    <Badge variant="outline">{onboardingProgress}% Complete</Badge>
                  </div>
                  <CardDescription>Verified facts about this member</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {Object.entries(factsByCategory).map(([category, categoryFacts]) => (
                    <div key={category}>
                      <h4 className="font-medium capitalize mb-3">{category.replace("_", " ")}</h4>
                      <div className="space-y-2">
                        {categoryFacts.map((fact) => (
                          <div key={fact.id} className="flex items-start gap-3 rounded-lg border border-border p-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-sm">{fact.key}</span>
                                <Badge variant="outline" className="text-xs">
                                  {fact.confidence}% confidence
                                </Badge>
                              </div>
                              <p className="text-sm">{fact.value}</p>
                              {fact.evidence && (
                                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                  <SourceBadge source={fact.provenance} size="sm" />
                                  {fact.evidence.url && (
                                    <a
                                      href={fact.evidence.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-1 hover:underline"
                                    >
                                      View source
                                      <ExternalLink className="h-3 w-3" />
                                    </a>
                                  )}
                                </div>
                              )}
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  {Object.keys(factsByCategory).length === 0 && (
                    <p className="text-center text-muted-foreground py-8">No facts recorded yet</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="signals" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Signal Timeline</CardTitle>
                  <CardDescription>Recent activity and signals detected</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {signals.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">No signals recorded</p>
                    ) : (
                      signals
                        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                        .map((signal) => (
                          <div key={signal.id} className="flex gap-4 rounded-lg border border-border p-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <SourceBadge source={signal.source} size="sm" />
                                <Badge variant="outline" className="text-xs capitalize">
                                  {signal.type.replace("_", " ")}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(signal.createdAt), { addSuffix: true })}
                                </span>
                              </div>
                              <p className="text-sm font-medium mb-1">{signal.whatHappened}</p>
                              {signal.impliedNeeds && signal.impliedNeeds.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {signal.impliedNeeds.map((need, i) => (
                                    <Badge key={i} variant="secondary" className="text-xs">
                                      {need}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="text-right">
                              <Badge variant={signal.urgency >= 7 ? "destructive" : "secondary"}>
                                Urgency: {signal.urgency}/10
                              </Badge>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="actions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Recommended Actions</CardTitle>
                  <CardDescription>AI-generated action recommendations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {opportunities.flatMap((o) => o.recommendedActions).length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">No actions recommended</p>
                    ) : (
                      opportunities
                        .flatMap((o) => o.recommendedActions)
                        .sort((a, b) => b.impactScore - a.impactScore)
                        .map((action) => (
                          <div key={action.id} className="rounded-lg border border-border p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <ActionTypeBadge type={action.type} />
                              <ImpactScoreBar score={action.impactScore} />
                            </div>
                            <p className="font-medium">{action.title}</p>
                            <p className="text-sm text-muted-foreground">{action.rationale}</p>
                            <Button size="sm">
                              <MessageSquare className="mr-1.5 h-3.5 w-3.5" />
                              Create Draft
                            </Button>
                          </div>
                        ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="drafts" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Message Drafts</CardTitle>
                  <CardDescription>Pending and sent messages</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {drafts.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">No drafts</p>
                    ) : (
                      drafts.map((draft) => (
                        <div key={draft.id} className="rounded-lg border border-border p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <ActionTypeBadge type={draft.actionType} size="sm" />
                            <Badge
                              variant={
                                draft.status === "sent"
                                  ? "default"
                                  : draft.status === "pending"
                                    ? "secondary"
                                    : "outline"
                              }
                            >
                              {draft.status}
                            </Badge>
                            {draft.autosendEligible && (
                              <Badge variant="outline" className="text-success border-success/30">
                                Auto-send eligible
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm line-clamp-3">{draft.content}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            Created {formatDistanceToNow(new Date(draft.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="intros" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Intro Suggestions</CardTitle>
                  <CardDescription>Recommended connections</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {visibleIntroSuggestions.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">No intro suggestions</p>
                    ) : (
                      visibleIntroSuggestions.map((suggestion) => {
                        const otherMemberId =
                          suggestion.memberAId === memberId ? suggestion.memberBId : suggestion.memberAId
                        const otherMember = tenantMembers.find((m) => m.id === otherMemberId)
                        if (!otherMember) return null

                        return (
                          <div key={suggestion.id} className="rounded-lg border border-border p-4">
                            <div className="flex items-center gap-3 mb-3">
                              <Avatar className="h-10 w-10">
                                <AvatarFallback className="bg-muted">
                                  {otherMember.firstName[0]}
                                  {otherMember.lastName[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">
                                  {otherMember.firstName} {otherMember.lastName}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {otherMember.company.role} at {otherMember.company.name}
                                </p>
                              </div>
                              <ImpactScoreBar score={suggestion.impactScore} className="ml-auto" />
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">{suggestion.rationale}</p>
                            <Button size="sm">
                              <Handshake className="mr-1.5 h-3.5 w-3.5" />
                              Create Intro
                            </Button>
                          </div>
                        )
                      })
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Intro History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {introRecords.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">No intro history</p>
                    ) : (
                      introRecords.map((record) => {
                        const otherMemberId = record.memberAId === memberId ? record.memberBId : record.memberAId
                        const otherMember = tenantMembers.find((m) => m.id === otherMemberId)
                        if (!otherMember) return null

                        return (
                          <div key={record.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs">
                                {otherMember.firstName[0]}
                                {otherMember.lastName[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="font-medium text-sm">
                                {otherMember.firstName} {otherMember.lastName}
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
                      })
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="perks" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Recommended Perks</CardTitle>
                  <CardDescription>Perks matched to this member's needs</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {visiblePerkRecommendations.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">No perk recommendations</p>
                    ) : (
                      visiblePerkRecommendations.map((rec) => {
                        const perk = perks.find((p) => p.id === rec.perkId)
                        if (!perk) return null

                        return (
                          <div key={rec.id} className="rounded-lg border border-border p-4">
                            <div className="flex items-start gap-3">
                              <div className="rounded-lg bg-muted p-2">
                                <Gift className="h-5 w-5 text-muted-foreground" />
                              </div>
                              <div className="flex-1">
                                <p className="font-medium">{perk.name}</p>
                                <p className="text-sm text-muted-foreground">{perk.partnerName}</p>
                                {perk.value && (
                                  <Badge variant="secondary" className="mt-2">
                                    {perk.value}
                                  </Badge>
                                )}
                              </div>
                              <ImpactScoreBar score={rec.impactScore} />
                            </div>
                            <p className="text-sm text-muted-foreground mt-3">{rec.rationale}</p>
                            <Button size="sm" className="mt-3">
                              <Gift className="mr-1.5 h-3.5 w-3.5" />
                              Send Perk
                            </Button>
                          </div>
                        )
                      })
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="outcomes" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Outcome History</CardTitle>
                  <CardDescription>Feedback from interactions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {outcomes.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">No outcomes recorded</p>
                    ) : (
                      outcomes.map((outcome) => (
                        <div
                          key={outcome.id}
                          className={`rounded-lg border p-4 ${
                            outcome.escalated ? "border-destructive/50 bg-destructive/5" : "border-border"
                          }`}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <Badge
                              variant={
                                outcome.rating >= 7 ? "default" : outcome.rating >= 5 ? "secondary" : "destructive"
                              }
                            >
                              Rating: {outcome.rating}/10
                            </Badge>
                            {outcome.escalated && (
                              <Badge variant="destructive">
                                <AlertTriangle className="mr-1 h-3 w-3" />
                                Escalated
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(outcome.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                          {outcome.feedback && <p className="text-sm">{outcome.feedback}</p>}
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-4 lg:sticky lg:top-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full justify-start" size="sm">
                <MessageSquare className="mr-2 h-4 w-4 shrink-0" />
                <span className="truncate">Generate DM</span>
              </Button>
              <Button variant="outline" className="w-full justify-start bg-transparent" size="sm">
                <Handshake className="mr-2 h-4 w-4 shrink-0" />
                <span className="truncate">Create Intro</span>
              </Button>
              <Button variant="outline" className="w-full justify-start bg-transparent" size="sm">
                <Gift className="mr-2 h-4 w-4 shrink-0" />
                <span className="truncate">Send Perk</span>
              </Button>
              <Button variant="outline" className="w-full justify-start bg-transparent" size="sm">
                <Target className="mr-2 h-4 w-4 shrink-0" />
                <span className="truncate">Forced Success</span>
              </Button>
              <Button variant="outline" className="w-full justify-start bg-transparent" size="sm">
                <Phone className="mr-2 h-4 w-4 shrink-0" />
                <span className="truncate">Schedule Call</span>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Contact State</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-muted-foreground">State</span>
                <Badge variant={member.contactState === "open" ? "default" : "secondary"}>{member.contactState}</Badge>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-muted-foreground shrink-0">Last Contact</span>
                <span className="text-sm text-right">
                  {member.lastContactedAt
                    ? formatDistanceToNow(new Date(member.lastContactedAt), { addSuffix: true })
                    : "Never"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-muted-foreground shrink-0">Last Value</span>
                <span className="text-sm text-right">
                  {member.lastValueDropAt
                    ? formatDistanceToNow(new Date(member.lastValueDropAt), { addSuffix: true })
                    : "Never"}
                </span>
              </div>
              <Button variant="outline" size="sm" className="w-full bg-transparent mt-2">
                {member.contactState === "open" ? "Mark Closed" : "Reopen"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Onboarding</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                {member.onboarding.intakeCompleted ? (
                  <CheckCircle className="h-4 w-4 text-success" />
                ) : (
                  <XCircle className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="text-sm">Intake Form</span>
              </div>
              <div className="flex items-center gap-2">
                {member.onboarding.welcomeCallCompleted ? (
                  <CheckCircle className="h-4 w-4 text-success" />
                ) : (
                  <XCircle className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="text-sm">Welcome Call</span>
              </div>
              <div className="flex items-center gap-2">
                {member.onboarding.introPackDelivered ? (
                  <CheckCircle className="h-4 w-4 text-success" />
                ) : (
                  <XCircle className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="text-sm">Intro Pack</span>
              </div>
              <div className="flex items-center gap-2">
                {member.onboarding.profileVerified ? (
                  <CheckCircle className="h-4 w-4 text-success" />
                ) : (
                  <XCircle className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="text-sm">Profile Verified</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tags</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1.5">
                {member.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
