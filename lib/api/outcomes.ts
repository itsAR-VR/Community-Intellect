import { mockOutcomeFeedback, mockInteractionLogs } from "../mock-data"
import type { OutcomeFeedback, InteractionLog } from "../types"

export async function getOutcomes(memberId?: string): Promise<OutcomeFeedback[]> {
  await new Promise((resolve) => setTimeout(resolve, 100))
  if (memberId) {
    return mockOutcomeFeedback.filter((o) => o.memberId === memberId)
  }
  return mockOutcomeFeedback
}

export async function getInteractionLogs(memberId: string): Promise<InteractionLog[]> {
  await new Promise((resolve) => setTimeout(resolve, 100))
  return mockInteractionLogs.filter((l) => l.memberId === memberId)
}

export async function submitOutcome(outcome: Omit<OutcomeFeedback, "id" | "createdAt">): Promise<OutcomeFeedback> {
  await new Promise((resolve) => setTimeout(resolve, 100))
  const newOutcome: OutcomeFeedback = {
    ...outcome,
    id: `outcome_${Date.now()}`,
    escalated: outcome.rating < 6,
    createdAt: new Date().toISOString(),
  }
  return newOutcome
}

export async function getEscalatedOutcomes(): Promise<OutcomeFeedback[]> {
  await new Promise((resolve) => setTimeout(resolve, 100))
  return mockOutcomeFeedback.filter((o) => o.escalated && !o.resolvedAt)
}
