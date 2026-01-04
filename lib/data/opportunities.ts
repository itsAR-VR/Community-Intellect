import "server-only"

import type { OpportunityItem, TenantId } from "@/lib/types"
import { dateToIso, dateToIsoOrUndefined, nullToUndefined } from "@/lib/data/_utils"
import { prisma } from "@/lib/prisma"

function opportunityRowToOpportunity(row: any): OpportunityItem {
  return {
    id: row.id,
    memberId: row.memberId,
    summary: row.summary,
    tags: row.tags ?? [],
    urgency: row.urgency,
    confidence: row.confidence,
    source: row.source,
    signalId: nullToUndefined(row.signalId),
    recommendedActions: (row.recommendedActions ?? []) as OpportunityItem["recommendedActions"],
    dismissed: row.dismissed,
    dismissedAt: dateToIsoOrUndefined(row.dismissedAt),
    dismissedBy: nullToUndefined(row.dismissedBy),
    createdAt: dateToIso(row.createdAt),
  }
}

export async function getOpportunities(tenantId: TenantId): Promise<OpportunityItem[]> {
  const data = await prisma.opportunity.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
  })
  return data.map(opportunityRowToOpportunity)
}

export async function getOpportunitiesByMember(memberId: string): Promise<OpportunityItem[]> {
  const data = await prisma.opportunity.findMany({
    where: { memberId },
    orderBy: { createdAt: "desc" },
  })
  return data.map(opportunityRowToOpportunity)
}

export async function getOpportunityById(id: string): Promise<OpportunityItem | null> {
  const data = await prisma.opportunity.findUnique({ where: { id } })
  return data ? opportunityRowToOpportunity(data) : null
}

export async function dismissOpportunity(id: string, dismissedBy: string): Promise<OpportunityItem | null> {
  const data = await prisma.opportunity
    .update({
      where: { id },
      data: {
        dismissed: true,
        dismissedAt: new Date(),
        dismissedBy,
      },
    })
    .catch(() => null)
  return data ? opportunityRowToOpportunity(data) : null
}
