import "server-only"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { Survey, TenantId } from "@/lib/types"
import { nullToUndefined } from "@/lib/data/_utils"

function surveyRowToSurvey(row: any): Survey {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    memberId: row.member_id,
    cadence: row.cadence,
    lastSentAt: nullToUndefined(row.last_sent_at),
    lastCompletedAt: nullToUndefined(row.last_completed_at),
    completionRate: row.completion_rate,
    responses: (row.responses ?? []) as Survey["responses"],
  }
}

export async function getSurveys(tenantId: TenantId): Promise<Survey[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.from("surveys").select("*").eq("tenant_id", tenantId).order("member_id", {
    ascending: true,
  })
  if (error) throw error
  return (data ?? []).map(surveyRowToSurvey)
}

export async function getSurveyByMember(memberId: string): Promise<Survey | null> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.from("surveys").select("*").eq("member_id", memberId).maybeSingle()
  if (error) throw error
  return data ? surveyRowToSurvey(data) : null
}

export async function getLowSatisfactionSurveys(tenantId: TenantId, threshold = 5): Promise<Survey[]> {
  const surveys = await getSurveys(tenantId)
  return surveys.filter((s) => {
    const valueResponse = s.responses.find((r) => r.question.toLowerCase().includes("valuable"))
    if (!valueResponse) return false
    const n = Number.parseInt(valueResponse.answer, 10)
    return Number.isFinite(n) && n <= threshold
  })
}

export async function sendSurvey(input: {
  id: string
  tenantId: TenantId
  memberId: string
  cadence: Survey["cadence"]
}): Promise<Survey> {
  const supabase = await createSupabaseServerClient()
  const now = new Date().toISOString()

  const { data: existing, error: existingError } = await supabase
    .from("surveys")
    .select("*")
    .eq("tenant_id", input.tenantId)
    .eq("member_id", input.memberId)
    .maybeSingle()
  if (existingError) throw existingError

  if (existing) {
    const { data, error } = await supabase
      .from("surveys")
      .update({ cadence: input.cadence, last_sent_at: now })
      .eq("id", existing.id)
      .select("*")
      .single()
    if (error) throw error
    return surveyRowToSurvey(data)
  }

  const { data, error } = await supabase
    .from("surveys")
    .insert({
      id: input.id,
      tenant_id: input.tenantId,
      member_id: input.memberId,
      cadence: input.cadence,
      last_sent_at: now,
      last_completed_at: null,
      completion_rate: 0,
      responses: [],
    })
    .select("*")
    .single()
  if (error) throw error
  return surveyRowToSurvey(data)
}
