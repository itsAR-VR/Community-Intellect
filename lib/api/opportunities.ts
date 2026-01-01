import { mockOpportunities, getOpportunitiesByMember as getMockOpportunitiesByMember } from "../mock-data"
import type { OpportunityItem } from "../types"

export async function getOpportunities(): Promise<OpportunityItem[]> {
  await new Promise((resolve) => setTimeout(resolve, 100))
  return mockOpportunities.filter((o) => !o.dismissed)
}

export async function getOpportunitiesByMember(memberId: string): Promise<OpportunityItem[]> {
  await new Promise((resolve) => setTimeout(resolve, 50))
  return getMockOpportunitiesByMember(memberId).filter((o) => !o.dismissed)
}

export async function dismissOpportunity(id: string, dismissedBy: string): Promise<OpportunityItem | null> {
  await new Promise((resolve) => setTimeout(resolve, 100))
  const opp = mockOpportunities.find((o) => o.id === id)
  if (!opp) return null
  return {
    ...opp,
    dismissed: true,
    dismissedAt: new Date().toISOString(),
    dismissedBy,
  }
}
