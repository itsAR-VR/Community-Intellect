import "server-only"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { ForcedSuccessItem, TenantId } from "@/lib/types"
import { nullToUndefined } from "@/lib/data/_utils"

function forcedRowToItem(row: any): ForcedSuccessItem {
  return {
    id: row.id,
    memberId: row.member_id,
    weekOf: row.week_of,
    recommendedActionType: row.recommended_action_type,
    recommendedActions: (row.recommended_actions ?? []) as ForcedSuccessItem["recommendedActions"],
    deliveredActionType: nullToUndefined(row.delivered_action_type),
    deliveredAt: nullToUndefined(row.delivered_at),
    deliveredBy: nullToUndefined(row.delivered_by),
    draftId: nullToUndefined(row.draft_id),
    blocked: row.blocked,
    blockedReason: nullToUndefined(row.blocked_reason),
    createdAt: row.created_at,
  }
}

export async function getForcedSuccessItems(tenantId: TenantId): Promise<ForcedSuccessItem[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from("forced_success_items")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("week_of", { ascending: false })
  if (error) throw error
  return (data ?? []).map(forcedRowToItem)
}

export async function getForcedSuccessByWeek(tenantId: TenantId, weekOf: string): Promise<ForcedSuccessItem[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from("forced_success_items")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("week_of", weekOf)
    .order("created_at", { ascending: false })
  if (error) throw error
  return (data ?? []).map(forcedRowToItem)
}

export async function getForcedSuccessByMember(memberId: string): Promise<ForcedSuccessItem[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from("forced_success_items")
    .select("*")
    .eq("member_id", memberId)
    .order("week_of", { ascending: false })
  if (error) throw error
  return (data ?? []).map(forcedRowToItem)
}

export async function createForcedSuccessItem(input: {
  id: string
  tenantId: TenantId
  memberId: string
  weekOf: string
  recommendedActionType: ForcedSuccessItem["recommendedActionType"]
  recommendedActions: ForcedSuccessItem["recommendedActions"]
}): Promise<ForcedSuccessItem> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from("forced_success_items")
    .insert({
      id: input.id,
      tenant_id: input.tenantId,
      member_id: input.memberId,
      week_of: input.weekOf,
      recommended_action_type: input.recommendedActionType,
      recommended_actions: input.recommendedActions,
    })
    .select("*")
    .single()
  if (error) throw error
  return forcedRowToItem(data)
}

export async function markForcedSuccessDelivered(input: {
  id: string
  deliveredActionType: ForcedSuccessItem["deliveredActionType"]
  deliveredBy: string
  draftId?: string
}): Promise<ForcedSuccessItem | null> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from("forced_success_items")
    .update({
      delivered_action_type: input.deliveredActionType ?? null,
      delivered_at: new Date().toISOString(),
      delivered_by: input.deliveredBy,
      draft_id: input.draftId ?? null,
      blocked: false,
      blocked_reason: null,
    })
    .eq("id", input.id)
    .select("*")
    .maybeSingle()
  if (error) throw error
  return data ? forcedRowToItem(data) : null
}

export async function overrideForcedSuccessBlock(input: { id: string; actorId: string }): Promise<ForcedSuccessItem | null> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from("forced_success_items")
    .update({
      blocked: false,
      blocked_reason: null,
      delivered_at: new Date().toISOString(),
      delivered_by: input.actorId,
    })
    .eq("id", input.id)
    .select("*")
    .maybeSingle()
  if (error) throw error
  return data ? forcedRowToItem(data) : null
}
