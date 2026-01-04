import "server-only"

import { randomUUID } from "crypto"
import type { Fact } from "@/lib/types"
import { dateToIso, dateToIsoOrUndefined, nullToUndefined } from "@/lib/data/_utils"
import { prisma } from "@/lib/prisma"

function factRowToFact(row: any): Fact {
  return {
    id: row.id,
    memberId: row.memberId,
    category: row.category,
    key: row.key,
    value: row.value,
    confidence: row.confidence,
    provenance: row.provenance,
    evidence: nullToUndefined(row.evidence),
    verifiedAt: dateToIsoOrUndefined(row.verifiedAt),
    verifiedBy: nullToUndefined(row.verifiedBy),
    createdAt: dateToIso(row.createdAt),
    updatedAt: dateToIso(row.updatedAt),
  }
}

export async function getFactsByMember(memberId: string): Promise<Fact[]> {
  const data = await prisma.fact.findMany({
    where: { memberId },
    orderBy: { createdAt: "desc" },
  })
  return data.map(factRowToFact)
}

export async function getFactsForTenant(tenantId: string): Promise<Fact[]> {
  const data = await prisma.fact.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
  })
  return data.map(factRowToFact)
}

export async function createFactForMember(input: {
  tenantId: string
  memberId: string
  category: Fact["category"]
  key: string
  value: string
  confidence?: number
  provenance?: Fact["provenance"]
}): Promise<Fact> {
  const now = new Date()
  const data = await prisma.fact.create({
    data: {
      id: randomUUID(),
      tenantId: input.tenantId,
      memberId: input.memberId,
      category: input.category,
      key: input.key,
      value: input.value,
      confidence: input.confidence ?? 90,
      provenance: input.provenance ?? "intake",
      verifiedAt: null,
      verifiedBy: null,
      createdAt: now,
      updatedAt: now,
    },
  })
  return factRowToFact(data)
}
