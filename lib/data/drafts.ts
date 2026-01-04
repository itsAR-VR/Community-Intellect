import "server-only"

import type { DraftStatus, MessageDraft, TenantId } from "@/lib/types"
import { dateToIso, dateToIsoOrUndefined, nullToUndefined } from "@/lib/data/_utils"
import { prisma } from "@/lib/prisma"

function draftRowToDraft(row: any): MessageDraft {
  return {
    id: row.id,
    memberId: row.memberId,
    actionType: row.actionType,
    subject: nullToUndefined(row.subject),
    content: row.content,
    impactScore: row.impactScore,
    autosendEligible: row.autosendEligible,
    blockedReasons: row.blockedReasons ?? [],
    sendRecommendation: row.sendRecommendation,
    status: row.status,
    mergedWithId: nullToUndefined(row.mergedWithId),
    generatedFromOpportunityId: nullToUndefined(row.generatedFromOpportunityId),
    generatedFromActionId: nullToUndefined(row.generatedFromActionId),
    editedAt: dateToIsoOrUndefined(row.editedAt),
    editedBy: nullToUndefined(row.editedBy),
    sentAt: dateToIsoOrUndefined(row.sentAt),
    sentBy: nullToUndefined(row.sentBy),
    createdAt: dateToIso(row.createdAt),
  }
}

export async function getDrafts(tenantId: TenantId, status?: DraftStatus): Promise<MessageDraft[]> {
  const data = await prisma.messageDraft.findMany({
    where: { tenantId, ...(status ? { status } : {}) },
    orderBy: { createdAt: "desc" },
  })
  return data.map(draftRowToDraft)
}

export async function getDraftsByMember(memberId: string): Promise<MessageDraft[]> {
  const data = await prisma.messageDraft.findMany({
    where: { memberId },
    orderBy: { createdAt: "desc" },
  })
  return data.map(draftRowToDraft)
}

export async function getDraftById(id: string): Promise<MessageDraft | null> {
  const data = await prisma.messageDraft.findUnique({ where: { id } })
  return data ? draftRowToDraft(data) : null
}

export async function updateDraft(id: string, updates: Partial<MessageDraft>, editorId: string): Promise<MessageDraft | null> {
  const patch: Record<string, unknown> = {}
  if (updates.subject !== undefined) patch.subject = updates.subject ?? null
  if (updates.content !== undefined) patch.content = updates.content
  if (updates.status !== undefined) patch.status = updates.status
  if (updates.autosendEligible !== undefined) patch.autosendEligible = updates.autosendEligible
  if (updates.blockedReasons !== undefined) patch.blockedReasons = updates.blockedReasons
  if (updates.sendRecommendation !== undefined) patch.sendRecommendation = updates.sendRecommendation
  if (updates.mergedWithId !== undefined) patch.mergedWithId = updates.mergedWithId ?? null
  if (updates.sentAt !== undefined) patch.sentAt = updates.sentAt ? new Date(updates.sentAt) : null
  if (updates.sentBy !== undefined) patch.sentBy = updates.sentBy ?? null

  patch.editedAt = new Date()
  patch.editedBy = editorId

  const data = await prisma.messageDraft.update({ where: { id }, data: patch }).catch(() => null)
  return data ? draftRowToDraft(data) : null
}
