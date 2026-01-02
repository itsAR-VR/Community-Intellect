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
import { requireWhoami } from "@/lib/auth/whoami"

export async function getOutcomes(memberId?: string): Promise<OutcomeFeedback[]> {
  if (memberId) return getOutcomeFeedbackByMember(memberId)
  const whoami = await requireWhoami()
  const results = await Promise.all(whoami.tenants.map((t) => getOutcomeFeedbackForTenant(t.id)))
  return results.flat()
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
  const whoami = await requireWhoami()
  const results = await Promise.all(whoami.tenants.map((t) => getEscalatedOutcomeFeedbackForTenant(t.id)))
  return results.flat()
}
