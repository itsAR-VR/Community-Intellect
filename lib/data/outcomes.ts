import "server-only"

import { randomUUID } from "crypto"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { InteractionLog, OutcomeFeedback, TenantId } from "@/lib/types"
import { nullToUndefined } from "@/lib/data/_utils"

function interactionRowToInteraction(row: any): InteractionLog {
  return {
    id: row.id,
    memberId: row.member_id,
    type: row.type,
    channel: row.channel,
    summary: row.summary,
    draftId: nullToUndefined(row.draft_id),
    createdBy: row.created_by,
    createdAt: row.created_at,
  }
}

function outcomeRowToOutcome(row: any): OutcomeFeedback {
  return {
    id: row.id,
    memberId: row.member_id,
    interactionId: row.interaction_id,
    rating: row.rating,
    feedback: nullToUndefined(row.feedback),
    escalated: row.escalated,
    escalationReason: nullToUndefined(row.escalation_reason),
    resolvedAt: nullToUndefined(row.resolved_at),
    resolvedBy: nullToUndefined(row.resolved_by),
    createdAt: row.created_at,
  }
}

export async function getInteractionLogsByMember(memberId: string): Promise<InteractionLog[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.from("interaction_logs").select("*").eq("member_id", memberId).order("created_at", {
    ascending: false,
  })
  if (error) throw error
  return (data ?? []).map(interactionRowToInteraction)
}

export async function getOutcomeFeedbackByMember(memberId: string): Promise<OutcomeFeedback[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.from("outcome_feedback").select("*").eq("member_id", memberId).order("created_at", {
    ascending: false,
  })
  if (error) throw error
  return (data ?? []).map(outcomeRowToOutcome)
}

export async function getOutcomeFeedbackForTenant(tenantId: TenantId): Promise<OutcomeFeedback[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from("outcome_feedback")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
  if (error) throw error
  return (data ?? []).map(outcomeRowToOutcome)
}

export async function getEscalatedOutcomeFeedbackForTenant(tenantId: TenantId): Promise<OutcomeFeedback[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from("outcome_feedback")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("escalated", true)
    .is("resolved_at", null)
    .order("created_at", { ascending: false })
  if (error) throw error
  return (data ?? []).map(outcomeRowToOutcome)
}

export async function submitOutcome(input: {
  id?: string
  tenantId: TenantId
  memberId: string
  interactionId: string
  rating: number
  feedback?: string
  escalationReason?: string
}): Promise<OutcomeFeedback> {
  const supabase = await createSupabaseServerClient()
  const now = new Date().toISOString()
  const id = input.id ?? randomUUID()
  const escalated = input.rating < 6

  const { data, error } = await supabase
    .from("outcome_feedback")
    .insert({
      id,
      tenant_id: input.tenantId,
      member_id: input.memberId,
      interaction_id: input.interactionId,
      rating: input.rating,
      feedback: input.feedback ?? null,
      escalated,
      escalation_reason: input.escalationReason ?? null,
      created_at: now,
    })
    .select("*")
    .single()
  if (error) throw error
  return outcomeRowToOutcome(data)
}
