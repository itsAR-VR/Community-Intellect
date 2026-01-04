import "server-only"

import type { InteractionLog, OutcomeFeedback } from "@/lib/types"
import {
  getEscalatedOutcomeFeedbackForTenant,
  getInteractionLogsByMember,
  getMemberById,
  getOutcomeFeedbackByMember,
  getOutcomeFeedbackForTenant,
  submitOutcome as dbSubmitOutcome,
} from "@/lib/data"
import { requireClubAccess } from "@/lib/auth/tenant-access"
import { CLUB_TENANT_ID } from "@/lib/club"

export async function getOutcomes(memberId?: string): Promise<OutcomeFeedback[]> {
  if (memberId) return getOutcomeFeedbackByMember(memberId)
  await requireClubAccess()
  return getOutcomeFeedbackForTenant(CLUB_TENANT_ID)
}

export async function getInteractionLogs(memberId: string): Promise<InteractionLog[]> {
  return getInteractionLogsByMember(memberId)
}

export async function submitOutcome(outcome: Omit<OutcomeFeedback, "id" | "createdAt">): Promise<OutcomeFeedback> {
  const member = await getMemberById(outcome.memberId)
  if (!member) throw new Error("Unknown member")

  return dbSubmitOutcome({
    tenantId: member.tenantId,
    memberId: outcome.memberId,
    interactionId: outcome.interactionId,
    rating: outcome.rating,
    feedback: outcome.feedback,
    escalationReason: outcome.escalationReason,
  })
}

export async function getEscalatedOutcomes(): Promise<OutcomeFeedback[]> {
  await requireClubAccess()
  return getEscalatedOutcomeFeedbackForTenant(CLUB_TENANT_ID)
}
