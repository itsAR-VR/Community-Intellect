import "server-only"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { PartnerApplicationStatus, Perk, PerkPartnerApplication, PerkRecommendation, TenantId } from "@/lib/types"
import { nullToUndefined } from "@/lib/data/_utils"

function perkRowToPerk(row: any): Perk {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    name: row.name,
    description: row.description,
    category: row.category,
    partnerName: row.partner_name,
    partnerLogo: nullToUndefined(row.partner_logo),
    value: nullToUndefined(row.value),
    url: nullToUndefined(row.url),
    expiresAt: nullToUndefined(row.expires_at),
    active: row.active,
    createdAt: row.created_at,
  }
}

function perkRecRowToRec(row: any): PerkRecommendation {
  return {
    id: row.id,
    memberId: row.member_id,
    perkId: row.perk_id,
    rationale: row.rationale,
    impactScore: row.impact_score,
    matchingFactIds: row.matching_fact_ids ?? [],
    dismissed: row.dismissed,
    deliveredAt: nullToUndefined(row.delivered_at),
    createdAt: row.created_at,
  }
}

function perkAppRowToApp(row: any): PerkPartnerApplication {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    companyName: row.company_name,
    contactName: row.contact_name,
    contactEmail: row.contact_email,
    perkDescription: row.perk_description,
    status: row.status,
    reviewedBy: nullToUndefined(row.reviewed_by),
    reviewedAt: nullToUndefined(row.reviewed_at),
    notes: nullToUndefined(row.notes),
    createdAt: row.created_at,
  }
}

export async function getPerks(tenantId: TenantId): Promise<Perk[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.from("perks").select("*").eq("tenant_id", tenantId).order("created_at", {
    ascending: false,
  })
  if (error) throw error
  return (data ?? []).map(perkRowToPerk)
}

export async function getPerkRecommendations(tenantId: TenantId, memberId?: string): Promise<PerkRecommendation[]> {
  const supabase = await createSupabaseServerClient()
  let q = supabase.from("perk_recommendations").select("*").eq("tenant_id", tenantId)
  if (memberId) q = q.eq("member_id", memberId)
  const { data, error } = await q.order("created_at", { ascending: false })
  if (error) throw error
  return (data ?? []).map(perkRecRowToRec)
}

export async function getPerkPartnerApplications(tenantId: TenantId): Promise<PerkPartnerApplication[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from("perk_partner_applications")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
  if (error) throw error
  return (data ?? []).map(perkAppRowToApp)
}

export async function createPerk(input: Omit<Perk, "id" | "createdAt"> & { id: string; createdAt?: string }): Promise<Perk> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from("perks")
    .insert({
      id: input.id,
      tenant_id: input.tenantId,
      name: input.name,
      description: input.description,
      category: input.category,
      partner_name: input.partnerName,
      partner_logo: input.partnerLogo ?? null,
      value: input.value ?? null,
      url: input.url ?? null,
      expires_at: input.expiresAt ?? null,
      active: input.active,
      created_at: input.createdAt ?? new Date().toISOString(),
    })
    .select("*")
    .single()
  if (error) throw error
  return perkRowToPerk(data)
}

export async function dismissPerkRecommendation(id: string): Promise<PerkRecommendation | null> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from("perk_recommendations")
    .update({ dismissed: true })
    .eq("id", id)
    .select("*")
    .maybeSingle()
  if (error) throw error
  return data ? perkRecRowToRec(data) : null
}

export async function markPerkDelivered(id: string): Promise<PerkRecommendation | null> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from("perk_recommendations")
    .update({ delivered_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .maybeSingle()
  if (error) throw error
  return data ? perkRecRowToRec(data) : null
}

export async function updatePartnerApplicationStatus(input: {
  id: string
  status: PartnerApplicationStatus
  reviewedBy: string
}): Promise<PerkPartnerApplication | null> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from("perk_partner_applications")
    .update({
      status: input.status,
      reviewed_by: input.reviewedBy,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", input.id)
    .select("*")
    .maybeSingle()
  if (error) throw error
  return data ? perkAppRowToApp(data) : null
}
