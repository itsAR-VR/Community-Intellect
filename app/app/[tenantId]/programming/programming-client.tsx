"use client"

import * as React from "react"
import { Calendar, Users, Presentation, ChevronLeft, ChevronRight, Plus, FileText, Copy } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { EmptyState } from "@/components/shared/empty-state"
import type { TenantId, Member, MastermindGroup, MonthlyClubAgenda, WorkshopPlan } from "@/lib/types"
import { format, addMonths, subMonths, startOfMonth } from "date-fns"

export function ProgrammingClient({
  tenantId,
  members,
  masterminds,
  agendas,
  workshops,
}: {
  tenantId: TenantId
  members: Member[]
  masterminds: MastermindGroup[]
  agendas: MonthlyClubAgenda[]
  workshops: WorkshopPlan[]
}) {
  const [currentMonth, setCurrentMonth] = React.useState(startOfMonth(new Date()))
  const monthString = format(currentMonth, "yyyy-MM")

  const agenda = agendas.find((a) => a.tenantId === tenantId && a.month === monthString)

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentMonth(direction === "prev" ? subMonths(currentMonth, 1) : addMonths(currentMonth, 1))
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Programming</h1>
        <p className="text-sm text-muted-foreground">Manage masterminds, workshops, and monthly agenda</p>
      </div>

      <Tabs defaultValue="masterminds" className="space-y-4">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="masterminds" className="flex-1 sm:flex-none">
            Masterminds
          </TabsTrigger>
          <TabsTrigger value="agenda" className="flex-1 sm:flex-none">
            Agenda
          </TabsTrigger>
          <TabsTrigger value="workshops" className="flex-1 sm:flex-none">
            Workshops
          </TabsTrigger>
        </TabsList>

        <TabsContent value="masterminds" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">{masterminds.length} Active Groups</h2>
            <Button className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Create Group
            </Button>
          </div>

          {masterminds.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No mastermind groups"
              description="Create your first mastermind group to get started"
              action={
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Group
                </Button>
              }
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {masterminds.map((group) => {
                const leader = members.find((m) => m.id === group.leaderId)
                const groupMembers = group.memberIds.map((id) => members.find((m) => m.id === id)).filter(Boolean)

                return (
                  <Card key={group.id}>
                    <CardHeader className="pb-3">
                      <div className="space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-base leading-tight">{group.name}</CardTitle>
                          {group.theme && (
                            <Badge variant="outline" className="shrink-0 text-xs whitespace-nowrap">
                              {group.theme}
                            </Badge>
                          )}
                        </div>
                        {leader && (
                          <CardDescription>
                            Led by {leader.firstName} {leader.lastName}
                          </CardDescription>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">{groupMembers.length} members</p>
                        <div className="flex -space-x-2">
                          {groupMembers.slice(0, 6).map((member) => (
                            <Avatar key={member?.id} className="h-8 w-8 border-2 border-background">
                              <AvatarFallback className="text-xs bg-muted">
                                {member?.firstName[0]}
                                {member?.lastName[0]}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                          {groupMembers.length > 6 && (
                            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium border-2 border-background">
                              +{groupMembers.length - 6}
                            </div>
                          )}
                        </div>
                      </div>

                      {group.nextSessionAt && (
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span>{format(new Date(group.nextSessionAt), "MMM d, h:mm a")}</span>
                        </div>
                      )}

                      {group.followUpItems.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium">
                            Follow-ups ({group.followUpItems.filter((f) => !f.completed).length})
                          </p>
                          {group.followUpItems.slice(0, 2).map((item, i) => (
                            <div key={i} className="flex items-start gap-2 text-sm">
                              <Checkbox checked={item.completed} className="mt-0.5 shrink-0" />
                              <span
                                className={`${item.completed ? "line-through text-muted-foreground" : ""} line-clamp-2`}
                              >
                                {item.item}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                          <FileText className="mr-1.5 h-3.5 w-3.5" />
                          Agenda
                        </Button>
                        <Button size="sm" className="flex-1">
                          Manage
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="agenda" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => navigateMonth("prev")}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="px-3 py-2 rounded-md border border-border bg-card min-w-[140px] text-center">
                <span className="font-medium text-sm">{format(currentMonth, "MMM yyyy")}</span>
              </div>
              <Button variant="outline" size="icon" onClick={() => navigateMonth("next")}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Button className="w-full sm:w-auto">
              <Copy className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Monthly Agenda</CardTitle>
              <CardDescription>Plan and organize this month&apos;s programming</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {agenda ? (
                <>
                  <div>
                    <h4 className="font-medium mb-2">Themes</h4>
                    <div className="flex flex-wrap gap-2">
                      {agenda.themes.map((theme, i) => (
                        <Badge key={i} variant="secondary">
                          {theme}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Speakers</h4>
                    <div className="space-y-2">
                      {agenda.speakers.map((speaker, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between rounded-lg border border-border p-3 gap-2"
                        >
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{speaker.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{speaker.topic}</p>
                          </div>
                          <Badge variant={speaker.confirmed ? "default" : "secondary"} className="shrink-0">
                            {speaker.confirmed ? "Confirmed" : "Pending"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Workshops</h4>
                    <div className="space-y-2">
                      {agenda.workshops.map((workshop) => (
                        <div
                          key={workshop.id}
                          className="flex items-center justify-between rounded-lg border border-border p-3 gap-2"
                        >
                          <p className="font-medium text-sm truncate min-w-0">{workshop.title}</p>
                          <Badge
                            variant={
                              workshop.status === "completed"
                                ? "default"
                                : workshop.status === "confirmed"
                                  ? "secondary"
                                  : "outline"
                            }
                            className="shrink-0"
                          >
                            {workshop.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Template</h4>
                    <Textarea value={agenda.template} readOnly rows={6} className="font-mono text-sm" />
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No agenda for this month</p>
                  <Button>Create Agenda</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workshops" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Workshop Planner</h2>
            <Button className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Plan Workshop
            </Button>
          </div>

          {workshops.length === 0 ? (
            <EmptyState
              icon={Presentation}
              title="No workshops planned"
              description="Start planning workshops for your members"
              action={
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Plan Workshop
                </Button>
              }
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {workshops.map((workshop) => (
                <Card key={workshop.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base leading-tight">{workshop.title}</CardTitle>
                      <Badge
                        variant={
                          workshop.status === "scheduled"
                            ? "default"
                            : workshop.status === "planning"
                              ? "secondary"
                              : workshop.status === "completed"
                                ? "outline"
                                : "secondary"
                        }
                        className="shrink-0"
                      >
                        {workshop.status}
                      </Badge>
                    </div>
                    <CardDescription className="line-clamp-2">{workshop.topic}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Target Audience</p>
                      <div className="flex flex-wrap gap-1">
                        {workshop.targetAudience.map((audience, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {audience}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {workshop.suggestedSpeakers.length > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Suggested Speakers</p>
                        <div className="space-y-2">
                          {workshop.suggestedSpeakers.slice(0, 2).map((speaker, i) => (
                            <div key={i} className="text-sm">
                              <p className="font-medium">{speaker.name}</p>
                              <p className="text-xs text-muted-foreground line-clamp-1">{speaker.rationale}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {workshop.scheduledAt && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4 shrink-0" />
                        <span>{format(new Date(workshop.scheduledAt), "MMM d, yyyy h:mm a")}</span>
                      </div>
                    )}

                    <Button size="sm" className="w-full">
                      Manage Workshop
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
