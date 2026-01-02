import "server-only"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { IntroRecord, IntroSuggestion, IntroStatus, TenantId } from "@/lib/types"
import { nullToUndefined } from "@/lib/data/_utils"

function introSuggestionRowToSuggestion(row: any): IntroSuggestion {
  return {
    id: row.id,
    memberAId: row.member_a_id,
    memberBId: row.member_b_id,
    rationale: row.rationale,
    impactScore: row.impact_score,
    matchingFactIds: row.matching_fact_ids ?? [],
    dismissed: row.dismissed,
    createdAt: row.created_at,
  }
}

function introRecordRowToRecord(row: any): IntroRecord {
  return {
    id: row.id,
    memberAId: row.member_a_id,
    memberBId: row.member_b_id,
    status: row.status as IntroStatus,
    suggestionId: nullToUndefined(row.suggestion_id),
    messageToA: nullToUndefined(row.message_to_a),
    messageToB: nullToUndefined(row.message_to_b),
    outcomeA: nullToUndefined(row.outcome_a),
    outcomeB: nullToUndefined(row.outcome_b),
    createdBy: row.created_by,
    createdAt: row.created_at,
    completedAt: nullToUndefined(row.completed_at),
  }
}

export async function getIntroSuggestions(tenantId: TenantId): Promise<IntroSuggestion[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from("intro_suggestions")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
  if (error) throw error
  return (data ?? []).map(introSuggestionRowToSuggestion)
}

export async function getIntroRecords(tenantId: TenantId): Promise<IntroRecord[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from("intro_records")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
  if (error) throw error
  return (data ?? []).map(introRecordRowToRecord)
}

export async function getIntroSuggestionsByMember(tenantId: TenantId, memberId: string): Promise<IntroSuggestion[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from("intro_suggestions")
    .select("*")
    .eq("tenant_id", tenantId)
    .or(`member_a_id.eq.${memberId},member_b_id.eq.${memberId}`)
    .order("created_at", { ascending: false })
  if (error) throw error
  return (data ?? []).map(introSuggestionRowToSuggestion)
}

export async function getIntroRecordsByMember(tenantId: TenantId, memberId: string): Promise<IntroRecord[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from("intro_records")
    .select("*")
    .eq("tenant_id", tenantId)
    .or(`member_a_id.eq.${memberId},member_b_id.eq.${memberId}`)
    .order("created_at", { ascending: false })
  if (error) throw error
  return (data ?? []).map(introRecordRowToRecord)
}

export async function dismissIntroSuggestion(id: string): Promise<IntroSuggestion | null> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from("intro_suggestions")
    .update({ dismissed: true })
    .eq("id", id)
    .select("*")
    .maybeSingle()
  if (error) throw error
  return data ? introSuggestionRowToSuggestion(data) : null
}

export async function createIntroRecord(input: {
  id: string
  tenantId: TenantId
  memberAId: string
  memberBId: string
  createdBy: string
  status?: IntroStatus
  suggestionId?: string
  messageToA?: string
  messageToB?: string
}): Promise<IntroRecord> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from("intro_records")
    .insert({
      id: input.id,
      tenant_id: input.tenantId,
      member_a_id: input.memberAId,
      member_b_id: input.memberBId,
      status: input.status ?? "pending",
      suggestion_id: input.suggestionId ?? null,
      message_to_a: input.messageToA ?? null,
      message_to_b: input.messageToB ?? null,
      created_by: input.createdBy,
    })
    .select("*")
    .single()
  if (error) throw error
  return introRecordRowToRecord(data)
}

export async function updateIntroStatus(id: string, status: IntroStatus): Promise<IntroRecord | null> {
  const supabase = await createSupabaseServerClient()
  const patch: Record<string, unknown> = { status }
  if (status === "completed") patch.completed_at = new Date().toISOString()

  const { data, error } = await supabase.from("intro_records").update(patch).eq("id", id).select("*").maybeSingle()
  if (error) throw error
  return data ? introRecordRowToRecord(data) : null
}
