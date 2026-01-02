import "server-only"

import type { OpportunityItem } from "@/lib/types"
import {
  dismissOpportunity as dbDismissOpportunity,
  getOpportunities as dbGetOpportunities,
  getOpportunitiesByMember as dbGetOpportunitiesByMember,
} from "@/lib/data"
import { requireWhoami } from "@/lib/auth/whoami"

export async function getOpportunities(): Promise<OpportunityItem[]> {
  const whoami = await requireWhoami()
  const results = await Promise.all(whoami.tenants.map((t) => dbGetOpportunities(t.id)))
  return results.flat().filter((o) => !o.dismissed)
}

export async function getOpportunitiesByMember(memberId: string): Promise<OpportunityItem[]> {
  const items = await dbGetOpportunitiesByMember(memberId)
  return items.filter((o) => !o.dismissed)
}

export async function dismissOpportunity(id: string, dismissedBy: string): Promise<OpportunityItem | null> {
  return dbDismissOpportunity(id, dismissedBy)
}
