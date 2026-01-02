import "server-only"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { Fact } from "@/lib/types"
import { nullToUndefined } from "@/lib/data/_utils"

function factRowToFact(row: any): Fact {
  return {
    id: row.id,
    memberId: row.member_id,
    category: row.category,
    key: row.key,
    value: row.value,
    confidence: row.confidence,
    provenance: row.provenance,
    evidence: nullToUndefined(row.evidence),
    verifiedAt: nullToUndefined(row.verified_at),
    verifiedBy: nullToUndefined(row.verified_by),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function getFactsByMember(memberId: string): Promise<Fact[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.from("facts").select("*").eq("member_id", memberId).order("created_at", {
    ascending: false,
  })
  if (error) throw error
  return (data ?? []).map(factRowToFact)
}

export async function getFactsForTenant(tenantId: string): Promise<Fact[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.from("facts").select("*").eq("tenant_id", tenantId).order("created_at", {
    ascending: false,
  })
  if (error) throw error
  return (data ?? []).map(factRowToFact)
}
