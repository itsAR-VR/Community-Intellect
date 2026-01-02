import "server-only"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { Member, TenantId } from "@/lib/types"
import { nullToUndefined } from "@/lib/data/_utils"

function toTenantId(id: string): TenantId {
  return id as TenantId
}

function memberRowToMember(row: any): Member {
  return {
    id: row.id,
    tenantId: toTenantId(row.tenant_id),
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    avatarUrl: nullToUndefined(row.avatar_url),
    linkedInUrl: nullToUndefined(row.linkedin_url),
    company: {
      name: row.company_name,
      role: row.company_role,
      website: nullToUndefined(row.company_website),
      stage: nullToUndefined(row.company_stage),
      headcount: nullToUndefined(row.company_headcount),
      industry: nullToUndefined(row.company_industry),
    },
    status: row.status,
    joinedAt: row.joined_at,
    renewalDate: nullToUndefined(row.renewal_date),
    riskTier: row.risk_tier,
    riskScore: row.risk_score,
    engagementScore: row.engagement_score,
    lastEngagementAt: nullToUndefined(row.last_engagement_at),
    contactState: row.contact_state,
    lastContactedAt: nullToUndefined(row.last_contacted_at),
    lastValueDropAt: nullToUndefined(row.last_value_drop_at),
    onboarding: row.onboarding ?? {},
    tags: row.tags ?? [],
    notes: nullToUndefined(row.notes),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function getMembers(tenantId: TenantId): Promise<Member[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from("members")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("last_name", { ascending: true })
  if (error) throw error
  return (data ?? []).map(memberRowToMember)
}

export async function getMemberById(memberId: string): Promise<Member | null> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.from("members").select("*").eq("id", memberId).maybeSingle()
  if (error) throw error
  return data ? memberRowToMember(data) : null
}

export async function updateMember(memberId: string, updates: Partial<Member>): Promise<Member | null> {
  const supabase = await createSupabaseServerClient()

  // Only supports a minimal subset for now.
  const patch: Record<string, unknown> = {}
  if (updates.contactState) patch.contact_state = updates.contactState
  if (updates.notes !== undefined) patch.notes = updates.notes
  if (updates.tags) patch.tags = updates.tags
  if (updates.status) patch.status = updates.status
  if (updates.riskTier) patch.risk_tier = updates.riskTier
  if (updates.riskScore !== undefined) patch.risk_score = updates.riskScore
  if (updates.engagementScore !== undefined) patch.engagement_score = updates.engagementScore
  if (updates.lastContactedAt !== undefined) patch.last_contacted_at = updates.lastContactedAt ?? null
  if (updates.lastValueDropAt !== undefined) patch.last_value_drop_at = updates.lastValueDropAt ?? null

  const { data, error } = await supabase.from("members").update(patch).eq("id", memberId).select("*").maybeSingle()
  if (error) throw error
  return data ? memberRowToMember(data) : null
}
