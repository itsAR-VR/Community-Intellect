import { mockMastermindGroups, mockMonthlyAgendas, mockWorkshopPlans } from "../mock-data"
import type { MastermindGroup, MonthlyClubAgenda, WorkshopPlan, TenantId } from "../types"

export async function getMastermindGroups(tenantId: TenantId): Promise<MastermindGroup[]> {
  await new Promise((resolve) => setTimeout(resolve, 100))
  return mockMastermindGroups.filter((m) => m.tenantId === tenantId)
}

export async function getMonthlyAgenda(tenantId: TenantId, month: string): Promise<MonthlyClubAgenda | null> {
  await new Promise((resolve) => setTimeout(resolve, 100))
  return mockMonthlyAgendas.find((a) => a.tenantId === tenantId && a.month === month) ?? null
}

export async function getWorkshopPlans(tenantId: TenantId): Promise<WorkshopPlan[]> {
  await new Promise((resolve) => setTimeout(resolve, 100))
  return mockWorkshopPlans.filter((w) => w.tenantId === tenantId)
}

export async function updateMastermindAgenda(id: string, agendaDraft: string): Promise<MastermindGroup | null> {
  await new Promise((resolve) => setTimeout(resolve, 100))
  const group = mockMastermindGroups.find((m) => m.id === id)
  if (!group) return null
  return { ...group, agendaDraft }
}
