import "server-only"

import type { ForcedSuccessItem, TenantId } from "@/lib/types"
import {
  getForcedSuccessByMember as dbGetForcedSuccessByMember,
  getForcedSuccessByWeek as dbGetForcedSuccessByWeek,
  getForcedSuccessItems as dbGetForcedSuccessItems,
  markForcedSuccessDelivered as dbMarkForcedSuccessDelivered,
} from "@/lib/data"

export async function getForcedSuccessItems(tenantId: TenantId, weekOf?: string): Promise<ForcedSuccessItem[]> {
  if (weekOf) return dbGetForcedSuccessByWeek(tenantId, weekOf)
  return dbGetForcedSuccessItems(tenantId)
}

export async function getForcedSuccessByMember(memberId: string): Promise<ForcedSuccessItem[]> {
  return dbGetForcedSuccessByMember(memberId)
}

export async function markForcedSuccessDelivered(
  id: string,
  deliveredBy: string,
  actionType: string,
  draftId?: string,
): Promise<ForcedSuccessItem | null> {
  return dbMarkForcedSuccessDelivered({
    id,
    deliveredActionType: actionType as ForcedSuccessItem["deliveredActionType"],
    deliveredBy,
    draftId,
  })
}

export async function getBlockedForcedSuccess(tenantId: TenantId): Promise<ForcedSuccessItem[]> {
  const items = await getForcedSuccessItems(tenantId)
  return items.filter((fs) => fs.blocked)
}

export async function getDueForcedSuccess(tenantId: TenantId, weekOf: string): Promise<ForcedSuccessItem[]> {
  const items = await getForcedSuccessItems(tenantId, weekOf)
  return items.filter((fs) => !fs.deliveredAt && !fs.blocked)
}
