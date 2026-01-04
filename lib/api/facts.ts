import "server-only"

import type { Fact } from "../types"
import { getFactsByMember as dbGetFactsByMember } from "@/lib/data"
import { dateToIso, dateToIsoOrUndefined, nullToUndefined } from "@/lib/data/_utils"
import { prisma } from "@/lib/prisma"

export async function getFactsByMember(memberId: string): Promise<Fact[]> {
  return dbGetFactsByMember(memberId)
}

export async function getAllFacts(): Promise<Fact[]> {
  // Prefer tenant-scoped access via DB/RLS. Kept only for backwards compatibility.
  return []
}

export async function updateFact(id: string, updates: Partial<Fact>): Promise<Fact | null> {
  const patch: Record<string, unknown> = {}
  if (updates.value !== undefined) patch.value = updates.value
  if (updates.confidence !== undefined) patch.confidence = updates.confidence
  if (updates.verifiedAt !== undefined) patch.verifiedAt = updates.verifiedAt ? new Date(updates.verifiedAt) : null
  if (updates.verifiedBy !== undefined) patch.verifiedBy = updates.verifiedBy ?? null
  if (updates.evidence !== undefined) patch.evidence = updates.evidence ?? null

  const data = await prisma.fact.update({ where: { id }, data: patch }).catch(() => null)
  if (!data) return null

  return {
    id: data.id,
    memberId: data.memberId,
    category: data.category as Fact["category"],
    key: data.key,
    value: data.value,
    confidence: data.confidence,
    provenance: data.provenance as Fact["provenance"],
    evidence: nullToUndefined(data.evidence as any),
    verifiedAt: dateToIsoOrUndefined(data.verifiedAt),
    verifiedBy: nullToUndefined(data.verifiedBy),
    createdAt: dateToIso(data.createdAt),
    updatedAt: dateToIso(data.updatedAt),
  }
}

export async function verifyFact(id: string, verifiedBy: string): Promise<Fact | null> {
  return updateFact(id, {
    verifiedAt: new Date().toISOString(),
    verifiedBy,
  })
}
