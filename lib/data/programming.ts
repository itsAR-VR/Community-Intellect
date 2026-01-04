import "server-only"

import type { MastermindGroup, MonthlyClubAgenda, TenantId, WorkshopPlan } from "@/lib/types"
import { dateToIso, dateToIsoOrUndefined, nullToUndefined } from "@/lib/data/_utils"
import { prisma } from "@/lib/prisma"

function mastermindRowToGroup(row: any): MastermindGroup {
  return {
    id: row.id,
    tenantId: row.tenantId,
    name: row.name,
    theme: nullToUndefined(row.theme),
    memberIds: row.memberIds ?? [],
    leaderId: row.leaderId,
    nextSessionAt: dateToIsoOrUndefined(row.nextSessionAt),
    rotationSchedule: row.rotationSchedule ?? [],
    agendaDraft: nullToUndefined(row.agendaDraft),
    followUpItems: (row.followUpItems ?? []) as MastermindGroup["followUpItems"],
    createdAt: dateToIso(row.createdAt),
  }
}

function agendaRowToAgenda(row: any): MonthlyClubAgenda {
  return {
    id: row.id,
    tenantId: row.tenantId,
    month: row.month,
    themes: row.themes ?? [],
    template: row.template,
    speakers: (row.speakers ?? []) as MonthlyClubAgenda["speakers"],
    workshops: (row.workshops ?? []) as MonthlyClubAgenda["workshops"],
    createdAt: dateToIso(row.createdAt),
    updatedAt: dateToIso(row.updatedAt),
  }
}

function workshopRowToWorkshop(row: any): WorkshopPlan {
  return {
    id: row.id,
    tenantId: row.tenantId,
    title: row.title,
    topic: row.topic,
    suggestedSpeakers: (row.suggestedSpeakers ?? []) as WorkshopPlan["suggestedSpeakers"],
    targetAudience: row.targetAudience ?? [],
    status: row.status,
    scheduledAt: dateToIsoOrUndefined(row.scheduledAt),
    createdAt: dateToIso(row.createdAt),
  }
}

export async function getMastermindGroups(tenantId: TenantId): Promise<MastermindGroup[]> {
  const data = await prisma.mastermindGroup.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
  })
  return data.map(mastermindRowToGroup)
}

export async function getMonthlyAgenda(tenantId: TenantId, month: string): Promise<MonthlyClubAgenda | null> {
  const data = await prisma.monthlyAgenda.findFirst({ where: { tenantId, month } })
  return data ? agendaRowToAgenda(data) : null
}

export async function getMonthlyAgendas(tenantId: TenantId): Promise<MonthlyClubAgenda[]> {
  const data = await prisma.monthlyAgenda.findMany({ where: { tenantId }, orderBy: { month: "desc" } })
  return data.map(agendaRowToAgenda)
}

export async function getWorkshopPlans(tenantId: TenantId): Promise<WorkshopPlan[]> {
  const data = await prisma.workshopPlan.findMany({ where: { tenantId }, orderBy: { createdAt: "desc" } })
  return data.map(workshopRowToWorkshop)
}

export async function updateMastermindAgenda(id: string, agendaDraft: string): Promise<MastermindGroup | null> {
  const data = await prisma.mastermindGroup.update({ where: { id }, data: { agendaDraft } }).catch(() => null)
  return data ? mastermindRowToGroup(data) : null
}

export async function createMastermindGroup(input: {
  id: string
  tenantId: TenantId
  name: string
  theme?: string
  leaderId: string
  memberIds: string[]
  nextSessionAt?: string
}): Promise<MastermindGroup> {
  const data = await prisma.mastermindGroup.create({
    data: {
      id: input.id,
      tenantId: input.tenantId,
      name: input.name,
      theme: input.theme ?? null,
      leaderId: input.leaderId,
      memberIds: input.memberIds,
      nextSessionAt: input.nextSessionAt ? new Date(input.nextSessionAt) : null,
      rotationSchedule: [],
      agendaDraft: null,
      followUpItems: [],
    },
  })
  return mastermindRowToGroup(data)
}

export async function createMonthlyAgenda(input: {
  id: string
  tenantId: TenantId
  month: string
  themes: string[]
  template: string
}): Promise<MonthlyClubAgenda> {
  const data = await prisma.monthlyAgenda.create({
    data: {
      id: input.id,
      tenantId: input.tenantId,
      month: input.month,
      themes: input.themes,
      template: input.template,
      speakers: [],
      workshops: [],
    },
  })
  return agendaRowToAgenda(data)
}

export async function updateMonthlyAgenda(input: {
  id: string
  themes?: string[]
  template?: string
}): Promise<MonthlyClubAgenda | null> {
  const patch: Record<string, unknown> = {}
  if (input.themes) patch.themes = input.themes
  if (input.template !== undefined) patch.template = input.template

  const data = await prisma.monthlyAgenda.update({ where: { id: input.id }, data: patch }).catch(() => null)
  return data ? agendaRowToAgenda(data) : null
}
