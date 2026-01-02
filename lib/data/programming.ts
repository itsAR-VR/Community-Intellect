import "server-only"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { MastermindGroup, MonthlyClubAgenda, TenantId, WorkshopPlan } from "@/lib/types"
import { nullToUndefined } from "@/lib/data/_utils"

function mastermindRowToGroup(row: any): MastermindGroup {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    name: row.name,
    theme: nullToUndefined(row.theme),
    memberIds: row.member_ids ?? [],
    leaderId: row.leader_id,
    nextSessionAt: nullToUndefined(row.next_session_at),
    rotationSchedule: row.rotation_schedule ?? [],
    agendaDraft: nullToUndefined(row.agenda_draft),
    followUpItems: (row.follow_up_items ?? []) as MastermindGroup["followUpItems"],
    createdAt: row.created_at,
  }
}

function agendaRowToAgenda(row: any): MonthlyClubAgenda {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    month: row.month,
    themes: row.themes ?? [],
    template: row.template,
    speakers: (row.speakers ?? []) as MonthlyClubAgenda["speakers"],
    workshops: (row.workshops ?? []) as MonthlyClubAgenda["workshops"],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function workshopRowToWorkshop(row: any): WorkshopPlan {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    title: row.title,
    topic: row.topic,
    suggestedSpeakers: (row.suggested_speakers ?? []) as WorkshopPlan["suggestedSpeakers"],
    targetAudience: row.target_audience ?? [],
    status: row.status,
    scheduledAt: nullToUndefined(row.scheduled_at),
    createdAt: row.created_at,
  }
}

export async function getMastermindGroups(tenantId: TenantId): Promise<MastermindGroup[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from("mastermind_groups")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
  if (error) throw error
  return (data ?? []).map(mastermindRowToGroup)
}

export async function getMonthlyAgenda(tenantId: TenantId, month: string): Promise<MonthlyClubAgenda | null> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from("monthly_agendas")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("month", month)
    .maybeSingle()
  if (error) throw error
  return data ? agendaRowToAgenda(data) : null
}

export async function getMonthlyAgendas(tenantId: TenantId): Promise<MonthlyClubAgenda[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from("monthly_agendas")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("month", { ascending: false })
  if (error) throw error
  return (data ?? []).map(agendaRowToAgenda)
}

export async function getWorkshopPlans(tenantId: TenantId): Promise<WorkshopPlan[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from("workshop_plans")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
  if (error) throw error
  return (data ?? []).map(workshopRowToWorkshop)
}

export async function updateMastermindAgenda(id: string, agendaDraft: string): Promise<MastermindGroup | null> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from("mastermind_groups")
    .update({ agenda_draft: agendaDraft })
    .eq("id", id)
    .select("*")
    .maybeSingle()
  if (error) throw error
  return data ? mastermindRowToGroup(data) : null
}
