import "server-only"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { OpportunityItem, TenantId } from "@/lib/types"
import { nullToUndefined } from "@/lib/data/_utils"

function opportunityRowToOpportunity(row: any): OpportunityItem {
  return {
    id: row.id,
    memberId: row.member_id,
    summary: row.summary,
    tags: row.tags ?? [],
    urgency: row.urgency,
    confidence: row.confidence,
    source: row.source,
    signalId: nullToUndefined(row.signal_id),
    recommendedActions: (row.recommended_actions ?? []) as OpportunityItem["recommendedActions"],
    dismissed: row.dismissed,
    dismissedAt: nullToUndefined(row.dismissed_at),
    dismissedBy: nullToUndefined(row.dismissed_by),
    createdAt: row.created_at,
  }
}

export async function getOpportunities(tenantId: TenantId): Promise<OpportunityItem[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from("opportunities")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
  if (error) throw error
  return (data ?? []).map(opportunityRowToOpportunity)
}

export async function getOpportunitiesByMember(memberId: string): Promise<OpportunityItem[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from("opportunities")
    .select("*")
    .eq("member_id", memberId)
    .order("created_at", { ascending: false })
  if (error) throw error
  return (data ?? []).map(opportunityRowToOpportunity)
}

export async function getOpportunityById(id: string): Promise<OpportunityItem | null> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.from("opportunities").select("*").eq("id", id).maybeSingle()
  if (error) throw error
  return data ? opportunityRowToOpportunity(data) : null
}

export async function dismissOpportunity(id: string, dismissedBy: string): Promise<OpportunityItem | null> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from("opportunities")
    .update({
      dismissed: true,
      dismissed_at: new Date().toISOString(),
      dismissed_by: dismissedBy,
    })
    .eq("id", id)
    .select("*")
    .maybeSingle()
  if (error) throw error
  return data ? opportunityRowToOpportunity(data) : null
}
