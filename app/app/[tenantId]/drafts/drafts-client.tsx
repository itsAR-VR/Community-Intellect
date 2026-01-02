"use client"

import * as React from "react"
import Link from "next/link"
import { MessageSquare, Send, Edit2, Merge, CheckCircle, AlertCircle, Clock, MoreHorizontal } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ActionTypeBadge } from "@/components/shared/action-type-badge"
import { ImpactScoreBar } from "@/components/shared/impact-score-bar"
import { EmptyState } from "@/components/shared/empty-state"
import { toast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import type { TenantId, MessageDraft, Member } from "@/lib/types"
import { formatDistanceToNow } from "date-fns"

export function DraftsClient({ tenantId, members, drafts: initialDrafts }: { tenantId: TenantId; members: Member[]; drafts: MessageDraft[] }) {
  const { user, canEdit } = useAuth()

  const [selectedDrafts, setSelectedDrafts] = React.useState<string[]>([])
  const [editingDraft, setEditingDraft] = React.useState<MessageDraft | null>(null)
  const [editedContent, setEditedContent] = React.useState("")
  const [drafts, setDrafts] = React.useState<MessageDraft[]>(initialDrafts)
  const [isMutating, setIsMutating] = React.useState(false)

  const pendingDrafts = drafts.filter((d) => d.status === "pending")

  const handleSelectAll = (checked: boolean) => {
    setSelectedDrafts(checked ? pendingDrafts.map((d) => d.id) : [])
  }

  const handleSelectDraft = (draftId: string, checked: boolean) => {
    setSelectedDrafts(checked ? [...selectedDrafts, draftId] : selectedDrafts.filter((id) => id !== draftId))
  }

  const openEditor = (draft: MessageDraft) => {
    setEditingDraft(draft)
    setEditedContent(draft.content)
  }

  const eligibleCount = pendingDrafts.filter((d) => d.autosendEligible).length
  const blockedCount = pendingDrafts.filter((d) => !d.autosendEligible).length

  const updateDraft = async (draftId: string, patch: Partial<MessageDraft>) => {
    setIsMutating(true)
    try {
      const res = await fetch("/app/api/drafts/update", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tenantId, draftId, ...patch }),
      })
      if (!res.ok) throw new Error(await res.text())
      const json = (await res.json()) as { draft: MessageDraft }
      setDrafts((prev) => prev.map((d) => (d.id === json.draft.id ? json.draft : d)))
      return json.draft
    } finally {
      setIsMutating(false)
    }
  }

  const saveDraft = async () => {
    if (!editingDraft) return
    try {
      const updated = await updateDraft(editingDraft.id, { content: editedContent })
      setEditingDraft(updated)
      toast({ title: "Draft saved" })
    } catch (e) {
      toast({ title: "Failed to save", description: e instanceof Error ? e.message : "Unknown error" })
    }
  }

  const sendDraft = async (draftId: string) => {
    try {
      const res = await fetch("/app/api/drafts/send", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tenantId, draftId }),
      })
      if (!res.ok) throw new Error(await res.text())
      const json = (await res.json()) as { draft: MessageDraft }
      setDrafts((prev) => prev.map((d) => (d.id === json.draft.id ? json.draft : d)))
      toast({ title: "Marked as sent" })
      if (editingDraft?.id === draftId) setEditingDraft(json.draft)
    } catch (e) {
      toast({ title: "Failed to send", description: e instanceof Error ? e.message : "Unknown error" })
    }
  }

  const discardDraft = async (draftId: string) => {
    try {
      const res = await fetch("/app/api/drafts/discard", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tenantId, draftId }),
      })
      if (!res.ok) throw new Error(await res.text())
      const json = (await res.json()) as { draft: MessageDraft }
      setDrafts((prev) => prev.map((d) => (d.id === json.draft.id ? json.draft : d)))
      toast({ title: "Draft discarded" })
    } catch (e) {
      toast({ title: "Failed to discard", description: e instanceof Error ? e.message : "Unknown error" })
    }
  }

  const regenerateDraft = async (draft: MessageDraft) => {
    try {
      const res = await fetch("/app/api/ai/draft-message", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tenantId, memberId: draft.memberId, actionType: draft.actionType }),
      })
      if (!res.ok) throw new Error(await res.text())
      const json = (await res.json()) as {
        draft: Pick<MessageDraft, "content" | "autosendEligible" | "blockedReasons" | "sendRecommendation">
      }
      await updateDraft(draft.id, json.draft)
      toast({ title: "Draft regenerated" })
    } catch (e) {
      toast({ title: "Failed to regenerate", description: e instanceof Error ? e.message : "Unknown error" })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Draft Queue</h1>
          <p className="text-muted-foreground">Review and send AI-generated messages</p>
        </div>
        <Button disabled={selectedDrafts.length < 2 || !canEdit}>
          <Merge className="mr-2 h-4 w-4" />
          Merge Selected ({selectedDrafts.length})
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-primary/10 p-3">
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingDrafts.length}</p>
                <p className="text-sm text-muted-foreground">Pending Drafts</p>
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
                <p className="text-2xl font-bold">{eligibleCount}</p>
                <p className="text-sm text-muted-foreground">Auto-send Eligible</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-warning/10 p-3">
                <AlertCircle className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{blockedCount}</p>
                <p className="text-sm text-muted-foreground">Review Required</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {pendingDrafts.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No pending drafts"
          description="All drafts have been processed. New drafts will appear here when generated."
        />
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={selectedDrafts.length === pendingDrafts.length && pendingDrafts.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm text-muted-foreground">Select all</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingDrafts.map((draft) => {
                const member = members.find((m) => m.id === draft.memberId)
                if (!member) return null

                return (
                  <div
                    key={draft.id}
                    className="flex items-start gap-4 rounded-lg border border-border p-4 hover:bg-accent/30 transition-colors"
                  >
                    <Checkbox
                      checked={selectedDrafts.includes(draft.id)}
                      onCheckedChange={(checked) => handleSelectDraft(draft.id, !!checked)}
                    />
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-muted text-muted-foreground text-sm">
                        {member.firstName[0]}
                        {member.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Link href={`/app/${tenantId}/members/${member.id}`} className="font-semibold hover:underline">
                          {member.firstName} {member.lastName}
                        </Link>
                        <ActionTypeBadge type={draft.actionType} size="sm" />
                        {draft.autosendEligible ? (
                          <Badge variant="outline" className="bg-success/10 text-success border-success/30 text-xs">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Auto-send OK
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30 text-xs">
                            <AlertCircle className="mr-1 h-3 w-3" />
                            Review
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{draft.content}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(draft.createdAt), { addSuffix: true })}
                        </span>
                        <ImpactScoreBar score={draft.impactScore} size="sm" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => openEditor(draft)} disabled={!canEdit || isMutating}>
                        <Edit2 className="mr-1.5 h-3.5 w-3.5" />
                        Edit
                      </Button>
                      <Button size="sm" onClick={() => void sendDraft(draft.id)} disabled={!canEdit || isMutating}>
                        <Send className="mr-1.5 h-3.5 w-3.5" />
                        Send
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem disabled={!canEdit || isMutating} onClick={() => void discardDraft(draft.id)}>
                            Discard
                          </DropdownMenuItem>
                          <DropdownMenuItem disabled={!canEdit || isMutating} onClick={() => void regenerateDraft(draft)}>
                            Regenerate
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Sheet open={!!editingDraft} onOpenChange={(open) => !open && setEditingDraft(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {editingDraft && (
            <>
              <SheetHeader>
                <SheetTitle>Edit Draft</SheetTitle>
                <SheetDescription>
                  {(() => {
                    const member = members.find((m) => m.id === editingDraft.memberId)
                    return `Message for ${member?.firstName} ${member?.lastName}`
                  })()}
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                <div className="space-y-2">
                  <Label>Message Content</Label>
                  <Textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    rows={8}
                    className="resize-none"
                  />
                </div>

                <div className="rounded-lg border border-border p-4 space-y-3">
                  <h4 className="font-medium text-sm">Autosend Eligibility</h4>
                  {editingDraft.autosendEligible ? (
                    <div className="flex items-center gap-2 text-success">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm">Eligible for auto-send</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-warning">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm">Not eligible for auto-send</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <p className="font-medium mb-1">Blocked reasons:</p>
                        <ul className="list-disc list-inside space-y-0.5">
                          {editingDraft.blockedReasons.map((reason, i) => (
                            <li key={i}>{reason}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 bg-transparent" onClick={() => setEditingDraft(null)}>
                    Cancel
                  </Button>
                  <Button className="flex-1" onClick={() => void saveDraft()} disabled={!canEdit || isMutating}>
                    Save
                  </Button>
                  <Button className="flex-1" onClick={() => void sendDraft(editingDraft.id)} disabled={!canEdit || isMutating}>
                    <Send className="mr-2 h-4 w-4" />
                    Send Now
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

