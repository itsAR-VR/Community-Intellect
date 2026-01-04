import "server-only"

import type { ExternalSignal } from "@/lib/types"
import { dateToIso, nullToUndefined } from "@/lib/data/_utils"
import { prisma } from "@/lib/prisma"

function signalRowToSignal(row: any): ExternalSignal {
  return {
    id: row.id,
    memberId: row.memberId,
    source: row.source,
    type: row.type,
    whatHappened: row.whatHappened,
    impliedNeeds: nullToUndefined(row.impliedNeeds) ?? [],
    tags: row.tags ?? [],
    urgency: row.urgency,
    confidence: row.confidence,
    evidence: row.evidence ?? {},
    processedAt: dateToIso(row.processedAt),
    createdAt: dateToIso(row.createdAt),
  }
}

export async function getSignalsByMember(memberId: string): Promise<ExternalSignal[]> {
  const data = await prisma.externalSignal.findMany({
    where: { memberId },
    orderBy: { createdAt: "desc" },
  })
  return data.map(signalRowToSignal)
}

export async function getSignalsForTenant(tenantId: string): Promise<ExternalSignal[]> {
  const data = await prisma.externalSignal.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
  })
  return data.map(signalRowToSignal)
}
