import "server-only"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { Pod, TenantId } from "@/lib/types"

function podRowToPod(row: any): Pod {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    name: row.name,
    memberIds: row.member_ids ?? [],
    monthlyGoalsPromptSent: row.monthly_goals_prompt_sent,
    monthlyGoalsReceived: row.monthly_goals_received ?? [],
    receiptsShared: row.receipts_shared ?? [],
    quietMemberIds: row.quiet_member_ids ?? [],
    createdAt: row.created_at,
  }
}

export async function getPods(tenantId: TenantId): Promise<Pod[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.from("pods").select("*").eq("tenant_id", tenantId).order("created_at", {
    ascending: false,
  })
  if (error) throw error
  return (data ?? []).map(podRowToPod)
}

export async function createPod(input: { id: string; tenantId: TenantId; name: string; memberIds: string[] }): Promise<Pod> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from("pods")
    .insert({
      id: input.id,
      tenant_id: input.tenantId,
      name: input.name,
      member_ids: input.memberIds,
      monthly_goals_prompt_sent: false,
      monthly_goals_received: [],
      receipts_shared: [],
      quiet_member_ids: [],
    })
    .select("*")
    .single()
  if (error) throw error
  return podRowToPod(data)
}
