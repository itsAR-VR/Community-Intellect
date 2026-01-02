import "server-only"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { MemberWrapped, PersonaCluster, TenantId } from "@/lib/types"
import { getMembers } from "@/lib/data/members"

function clusterRowToCluster(row: any): PersonaCluster {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    name: row.name,
    description: row.description,
    memberIds: row.member_ids ?? [],
    characteristics: row.characteristics ?? [],
    suggestedUses: row.suggested_uses ?? [],
    createdAt: row.created_at,
  }
}

function wrappedRowToWrapped(row: any): MemberWrapped {
  return {
    memberId: row.member_id,
    period: row.period,
    startSnapshot: row.start_snapshot,
    currentSnapshot: row.current_snapshot,
    highlights: row.highlights,
    wins: row.wins ?? [],
    generatedAt: row.generated_at,
  }
}

export async function getPersonaClusters(tenantId: TenantId): Promise<PersonaCluster[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from("persona_clusters")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
  if (error) throw error
  return (data ?? []).map(clusterRowToCluster)
}

export async function getWrapped(tenantId: TenantId): Promise<MemberWrapped[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.from("member_wrapped").select("*").eq("tenant_id", tenantId)
  if (error) throw error
  return (data ?? []).map(wrappedRowToWrapped)
}

export async function getMemberWrapped(memberId: string, period: string): Promise<MemberWrapped | null> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from("member_wrapped")
    .select("*")
    .eq("member_id", memberId)
    .eq("period", period)
    .maybeSingle()
  if (error) throw error
  return data ? wrappedRowToWrapped(data) : null
}

export async function getClubMetrics(tenantId: TenantId): Promise<{
  totalMembers: number
  activeMembers: number
  atRiskMembers: number
  avgEngagement: number
  introsThisMonth: number
  forcedSuccessCompliance: number
}> {
  const supabase = await createSupabaseServerClient()
  const members = await getMembers(tenantId)
  const active = members.filter((m) => m.status === "active")
  const atRisk = members.filter((m) => m.riskTier === "red" || m.riskTier === "yellow")

  const avgEngagement =
    active.length > 0 ? Math.round(active.reduce((sum, m) => sum + m.engagementScore, 0) / active.length) : 0

  const startOfMonth = new Date()
  startOfMonth.setUTCDate(1)
  startOfMonth.setUTCHours(0, 0, 0, 0)

  const { count: introCount, error: introCountError } = await supabase
    .from("intro_records")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .gte("created_at", startOfMonth.toISOString())
  if (introCountError) throw introCountError

  const monthDay = startOfMonth.toISOString().slice(0, 10)
  const { count: forcedTotal, error: forcedTotalError } = await supabase
    .from("forced_success_items")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .gte("week_of", monthDay)
  if (forcedTotalError) throw forcedTotalError

  const { count: forcedDelivered, error: forcedDeliveredError } = await supabase
    .from("forced_success_items")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .gte("week_of", monthDay)
    .not("delivered_at", "is", null)
  if (forcedDeliveredError) throw forcedDeliveredError

  const forcedSuccessCompliance =
    (forcedTotal ?? 0) > 0 ? Math.round(((forcedDelivered ?? 0) / (forcedTotal ?? 1)) * 100) : 100

  return {
    totalMembers: members.length,
    activeMembers: active.length,
    atRiskMembers: atRisk.length,
    avgEngagement,
    introsThisMonth: introCount ?? 0,
    forcedSuccessCompliance,
  }
}
