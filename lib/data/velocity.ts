import "server-only"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { TenantId, VelocityChallenge, VelocityProof } from "@/lib/types"

function challengeRowToChallenge(row: any): VelocityChallenge {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    title: row.title,
    theme: row.theme,
    participantIds: row.participant_ids ?? [],
    startDate: row.start_date,
    endDate: row.end_date,
    active: row.active,
    createdAt: row.created_at,
  }
}

function proofRowToProof(row: any): VelocityProof {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    challengeId: row.challenge_id,
    memberId: row.member_id,
    link: row.link,
    description: row.description,
    createdAt: row.created_at,
  }
}

export async function getVelocityChallenges(tenantId: TenantId): Promise<VelocityChallenge[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from("velocity_challenges")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
  if (error) throw error
  return (data ?? []).map(challengeRowToChallenge)
}

export async function getVelocityProofs(tenantId: TenantId): Promise<VelocityProof[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from("velocity_proofs")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
  if (error) throw error
  return (data ?? []).map(proofRowToProof)
}

export async function createVelocityChallenge(input: {
  id: string
  tenantId: TenantId
  title: string
  theme: string
  participantIds: string[]
  startDate: string
  endDate: string
  active: boolean
}): Promise<VelocityChallenge> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from("velocity_challenges")
    .insert({
      id: input.id,
      tenant_id: input.tenantId,
      title: input.title,
      theme: input.theme,
      participant_ids: input.participantIds,
      start_date: input.startDate,
      end_date: input.endDate,
      active: input.active,
    })
    .select("*")
    .single()
  if (error) throw error
  return challengeRowToChallenge(data)
}

export async function createVelocityProof(input: {
  id: string
  tenantId: TenantId
  challengeId: string
  memberId: string
  link: string
  description: string
}): Promise<VelocityProof> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from("velocity_proofs")
    .insert({
      id: input.id,
      tenant_id: input.tenantId,
      challenge_id: input.challengeId,
      member_id: input.memberId,
      link: input.link,
      description: input.description,
    })
    .select("*")
    .single()
  if (error) throw error
  return proofRowToProof(data)
}

