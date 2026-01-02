import "server-only"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { ExternalSignal } from "@/lib/types"
import { nullToUndefined } from "@/lib/data/_utils"

function signalRowToSignal(row: any): ExternalSignal {
  return {
    id: row.id,
    memberId: row.member_id,
    source: row.source,
    type: row.type,
    whatHappened: row.what_happened,
    impliedNeeds: nullToUndefined(row.implied_needs) ?? [],
    tags: row.tags ?? [],
    urgency: row.urgency,
    confidence: row.confidence,
    evidence: row.evidence ?? {},
    processedAt: row.processed_at,
    createdAt: row.created_at,
  }
}

export async function getSignalsByMember(memberId: string): Promise<ExternalSignal[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from("external_signals")
    .select("*")
    .eq("member_id", memberId)
    .order("created_at", { ascending: false })
  if (error) throw error
  return (data ?? []).map(signalRowToSignal)
}

export async function getSignalsForTenant(tenantId: string): Promise<ExternalSignal[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from("external_signals")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
  if (error) throw error
  return (data ?? []).map(signalRowToSignal)
}
