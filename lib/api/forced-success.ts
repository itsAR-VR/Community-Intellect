import { mockForcedSuccessItems, getForcedSuccessByWeek as getMockForcedSuccessByWeek } from "../mock-data"
import type { ForcedSuccessItem, TenantId } from "../types"

export async function getForcedSuccessItems(tenantId: TenantId, weekOf?: string): Promise<ForcedSuccessItem[]> {
  await new Promise((resolve) => setTimeout(resolve, 100))
  if (weekOf) {
    return getMockForcedSuccessByWeek(tenantId, weekOf)
  }
  return mockForcedSuccessItems
}

export async function getForcedSuccessByMember(memberId: string): Promise<ForcedSuccessItem[]> {
  await new Promise((resolve) => setTimeout(resolve, 50))
  return mockForcedSuccessItems.filter((fs) => fs.memberId === memberId)
}

export async function markForcedSuccessDelivered(
  id: string,
  deliveredBy: string,
  actionType: string,
  draftId?: string,
): Promise<ForcedSuccessItem | null> {
  await new Promise((resolve) => setTimeout(resolve, 100))
  const item = mockForcedSuccessItems.find((fs) => fs.id === id)
  if (!item) return null
  return {
    ...item,
    deliveredActionType: actionType as ForcedSuccessItem["deliveredActionType"],
    deliveredAt: new Date().toISOString(),
    deliveredBy,
    draftId,
    blocked: false,
  }
}

export async function getBlockedForcedSuccess(tenantId: TenantId): Promise<ForcedSuccessItem[]> {
  const items = await getForcedSuccessItems(tenantId)
  return items.filter((fs) => fs.blocked)
}

export async function getDueForcedSuccess(tenantId: TenantId, weekOf: string): Promise<ForcedSuccessItem[]> {
  const items = await getForcedSuccessItems(tenantId, weekOf)
  return items.filter((fs) => !fs.deliveredAt && !fs.blocked)
}
