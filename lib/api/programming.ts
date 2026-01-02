import "server-only"

import type { MastermindGroup, MonthlyClubAgenda, TenantId, WorkshopPlan } from "@/lib/types"
import {
  getMastermindGroups as dbGetMastermindGroups,
  getMonthlyAgenda as dbGetMonthlyAgenda,
  getWorkshopPlans as dbGetWorkshopPlans,
  updateMastermindAgenda as dbUpdateMastermindAgenda,
} from "@/lib/data"

export async function getMastermindGroups(tenantId: TenantId): Promise<MastermindGroup[]> {
  return dbGetMastermindGroups(tenantId)
}

export async function getMonthlyAgenda(tenantId: TenantId, month: string): Promise<MonthlyClubAgenda | null> {
  return dbGetMonthlyAgenda(tenantId, month)
}

export async function getWorkshopPlans(tenantId: TenantId): Promise<WorkshopPlan[]> {
  return dbGetWorkshopPlans(tenantId)
}

export async function updateMastermindAgenda(id: string, agendaDraft: string): Promise<MastermindGroup | null> {
  return dbUpdateMastermindAgenda(id, agendaDraft)
}
