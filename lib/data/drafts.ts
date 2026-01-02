import "server-only"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { DraftStatus, MessageDraft, TenantId } from "@/lib/types"
import { nullToUndefined } from "@/lib/data/_utils"

function draftRowToDraft(row: any): MessageDraft {
  return {
    id: row.id,
    memberId: row.member_id,
    actionType: row.action_type,
    subject: nullToUndefined(row.subject),
    content: row.content,
    impactScore: row.impact_score,
    autosendEligible: row.autosend_eligible,
    blockedReasons: row.blocked_reasons ?? [],
    sendRecommendation: row.send_recommendation,
    status: row.status,
    mergedWithId: nullToUndefined(row.merged_with_id),
    generatedFromOpportunityId: nullToUndefined(row.generated_from_opportunity_id),
    generatedFromActionId: nullToUndefined(row.generated_from_action_id),
    editedAt: nullToUndefined(row.edited_at),
    editedBy: nullToUndefined(row.edited_by),
    sentAt: nullToUndefined(row.sent_at),
    sentBy: nullToUndefined(row.sent_by),
    createdAt: row.created_at,
  }
}

export async function getDrafts(tenantId: TenantId, status?: DraftStatus): Promise<MessageDraft[]> {
  const supabase = await createSupabaseServerClient()
  let q = supabase.from("message_drafts").select("*").eq("tenant_id", tenantId)
  if (status) q = q.eq("status", status)
  const { data, error } = await q.order("created_at", { ascending: false })
  if (error) throw error
  return (data ?? []).map(draftRowToDraft)
}

export async function getDraftsByMember(memberId: string): Promise<MessageDraft[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from("message_drafts")
    .select("*")
    .eq("member_id", memberId)
    .order("created_at", { ascending: false })
  if (error) throw error
  return (data ?? []).map(draftRowToDraft)
}

export async function getDraftById(id: string): Promise<MessageDraft | null> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.from("message_drafts").select("*").eq("id", id).maybeSingle()
  if (error) throw error
  return data ? draftRowToDraft(data) : null
}

export async function updateDraft(id: string, updates: Partial<MessageDraft>, editorId: string): Promise<MessageDraft | null> {
  const supabase = await createSupabaseServerClient()

  const patch: Record<string, unknown> = {}
  if (updates.subject !== undefined) patch.subject = updates.subject ?? null
  if (updates.content !== undefined) patch.content = updates.content
  if (updates.status !== undefined) patch.status = updates.status
  if (updates.autosendEligible !== undefined) patch.autosend_eligible = updates.autosendEligible
  if (updates.blockedReasons !== undefined) patch.blocked_reasons = updates.blockedReasons
  if (updates.sendRecommendation !== undefined) patch.send_recommendation = updates.sendRecommendation
  if (updates.mergedWithId !== undefined) patch.merged_with_id = updates.mergedWithId ?? null
  if (updates.sentAt !== undefined) patch.sent_at = updates.sentAt ?? null
  if (updates.sentBy !== undefined) patch.sent_by = updates.sentBy ?? null

  patch.edited_at = new Date().toISOString()
  patch.edited_by = editorId

  const { data, error } = await supabase.from("message_drafts").update(patch).eq("id", id).select("*").maybeSingle()
  if (error) throw error
  return data ? draftRowToDraft(data) : null
}
