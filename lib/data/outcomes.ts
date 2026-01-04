import "server-only"

import { randomUUID } from "crypto"
import type { InteractionLog, OutcomeFeedback, TenantId } from "@/lib/types"
import { dateToIso, dateToIsoOrUndefined, nullToUndefined } from "@/lib/data/_utils"
import { prisma } from "@/lib/prisma"

function interactionRowToInteraction(row: any): InteractionLog {
  return {
    id: row.id,
    memberId: row.memberId,
    type: row.type,
    channel: row.channel,
    summary: row.summary,
    draftId: nullToUndefined(row.draftId),
    createdBy: row.createdBy,
    createdAt: dateToIso(row.createdAt),
  }
}

function outcomeRowToOutcome(row: any): OutcomeFeedback {
  return {
    id: row.id,
    memberId: row.memberId,
    interactionId: row.interactionId,
    rating: row.rating,
    feedback: nullToUndefined(row.feedback),
    escalated: row.escalated,
    escalationReason: nullToUndefined(row.escalationReason),
    resolvedAt: dateToIsoOrUndefined(row.resolvedAt),
    resolvedBy: nullToUndefined(row.resolvedBy),
    createdAt: dateToIso(row.createdAt),
  }
}

export async function getInteractionLogsByMember(memberId: string): Promise<InteractionLog[]> {
  const data = await prisma.interactionLog.findMany({ where: { memberId }, orderBy: { createdAt: "desc" } })
  return data.map(interactionRowToInteraction)
}

export async function getOutcomeFeedbackByMember(memberId: string): Promise<OutcomeFeedback[]> {
  const data = await prisma.outcomeFeedback.findMany({ where: { memberId }, orderBy: { createdAt: "desc" } })
  return data.map(outcomeRowToOutcome)
}

export async function getOutcomeFeedbackForTenant(tenantId: TenantId): Promise<OutcomeFeedback[]> {
  const data = await prisma.outcomeFeedback.findMany({ where: { tenantId }, orderBy: { createdAt: "desc" } })
  return data.map(outcomeRowToOutcome)
}

export async function getEscalatedOutcomeFeedbackForTenant(tenantId: TenantId): Promise<OutcomeFeedback[]> {
  const data = await prisma.outcomeFeedback.findMany({
    where: { tenantId, escalated: true, resolvedAt: null },
    orderBy: { createdAt: "desc" },
  })
  return data.map(outcomeRowToOutcome)
}

export async function submitOutcome(input: {
  id?: string
  tenantId: TenantId
  memberId: string
  interactionId: string
  rating: number
  feedback?: string
  escalationReason?: string
}): Promise<OutcomeFeedback> {
  const now = new Date()
  const id = input.id ?? randomUUID()
  const escalated = input.rating < 6

  const data = await prisma.outcomeFeedback.create({
    data: {
      id,
      tenantId: input.tenantId,
      memberId: input.memberId,
      interactionId: input.interactionId,
      rating: input.rating,
      feedback: input.feedback ?? null,
      escalated,
      escalationReason: input.escalationReason ?? null,
      createdAt: now,
    },
  })
  return outcomeRowToOutcome(data)
}
