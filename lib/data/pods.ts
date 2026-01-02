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
