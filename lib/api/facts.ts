import "server-only"

import type { Fact } from "../types"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getFactsByMember as dbGetFactsByMember } from "@/lib/data"

export async function getFactsByMember(memberId: string): Promise<Fact[]> {
  return dbGetFactsByMember(memberId)
}

export async function getAllFacts(): Promise<Fact[]> {
  // Prefer tenant-scoped access via DB/RLS. Kept only for backwards compatibility.
  return []
}

export async function updateFact(id: string, updates: Partial<Fact>): Promise<Fact | null> {
  const supabase = await createSupabaseServerClient()
  const patch: Record<string, unknown> = {}
  if (updates.value !== undefined) patch.value = updates.value
  if (updates.confidence !== undefined) patch.confidence = updates.confidence
  if (updates.verifiedAt !== undefined) patch.verified_at = updates.verifiedAt ?? null
  if (updates.verifiedBy !== undefined) patch.verified_by = updates.verifiedBy ?? null
  if (updates.evidence !== undefined) patch.evidence = updates.evidence ?? null

  const { data, error } = await supabase.from("facts").update(patch).eq("id", id).select("*").maybeSingle()
  if (error) throw error
  if (!data) return null

  return {
    id: data.id,
    memberId: data.member_id,
    category: data.category,
    key: data.key,
    value: data.value,
    confidence: data.confidence,
    provenance: data.provenance,
    evidence: data.evidence ?? undefined,
    verifiedAt: data.verified_at ?? undefined,
    verifiedBy: data.verified_by ?? undefined,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

export async function verifyFact(id: string, verifiedBy: string): Promise<Fact | null> {
  return updateFact(id, {
    verifiedAt: new Date().toISOString(),
    verifiedBy,
  })
}
