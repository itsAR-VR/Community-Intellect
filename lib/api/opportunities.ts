import "server-only"

import type { OpportunityItem } from "@/lib/types"
import {
  dismissOpportunity as dbDismissOpportunity,
  getOpportunities as dbGetOpportunities,
  getOpportunitiesByMember as dbGetOpportunitiesByMember,
} from "@/lib/data"
import { requireClubAccess } from "@/lib/auth/tenant-access"
import { CLUB_TENANT_ID } from "@/lib/club"

export async function getOpportunities(): Promise<OpportunityItem[]> {
  await requireClubAccess()
  const items = await dbGetOpportunities(CLUB_TENANT_ID)
  return items.filter((o) => !o.dismissed)
}

export async function getOpportunitiesByMember(memberId: string): Promise<OpportunityItem[]> {
  await requireClubAccess()
  const items = await dbGetOpportunitiesByMember(memberId)
  return items.filter((o) => !o.dismissed)
}

export async function dismissOpportunity(id: string, dismissedBy: string): Promise<OpportunityItem | null> {
  await requireClubAccess()
  return dbDismissOpportunity(id, dismissedBy)
}
