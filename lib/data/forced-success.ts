import "server-only"

import type { ForcedSuccessItem, TenantId } from "@/lib/types"
import { dateToIso, dateToIsoOrUndefined, nullToUndefined } from "@/lib/data/_utils"
import { prisma } from "@/lib/prisma"

function forcedRowToItem(row: any): ForcedSuccessItem {
  return {
    id: row.id,
    memberId: row.memberId,
    weekOf: row.weekOf,
    recommendedActionType: row.recommendedActionType,
    recommendedActions: (row.recommendedActions ?? []) as ForcedSuccessItem["recommendedActions"],
    deliveredActionType: nullToUndefined(row.deliveredActionType),
    deliveredAt: dateToIsoOrUndefined(row.deliveredAt),
    deliveredBy: nullToUndefined(row.deliveredBy),
    draftId: nullToUndefined(row.draftId),
    blocked: row.blocked,
    blockedReason: nullToUndefined(row.blockedReason),
    createdAt: dateToIso(row.createdAt),
  }
}

export async function getForcedSuccessItems(tenantId: TenantId): Promise<ForcedSuccessItem[]> {
  const data = await prisma.forcedSuccessItem.findMany({
    where: { tenantId },
    orderBy: { weekOf: "desc" },
  })
  return data.map(forcedRowToItem)
}

export async function getForcedSuccessByWeek(tenantId: TenantId, weekOf: string): Promise<ForcedSuccessItem[]> {
  const data = await prisma.forcedSuccessItem.findMany({
    where: { tenantId, weekOf },
    orderBy: { createdAt: "desc" },
  })
  return data.map(forcedRowToItem)
}

export async function getForcedSuccessByMember(memberId: string): Promise<ForcedSuccessItem[]> {
  const data = await prisma.forcedSuccessItem.findMany({
    where: { memberId },
    orderBy: { weekOf: "desc" },
  })
  return data.map(forcedRowToItem)
}

export async function createForcedSuccessItem(input: {
  id: string
  tenantId: TenantId
  memberId: string
  weekOf: string
  recommendedActionType: ForcedSuccessItem["recommendedActionType"]
  recommendedActions: ForcedSuccessItem["recommendedActions"]
}): Promise<ForcedSuccessItem> {
  const data = await prisma.forcedSuccessItem.create({
    data: {
      id: input.id,
      tenantId: input.tenantId,
      memberId: input.memberId,
      weekOf: input.weekOf,
      recommendedActionType: input.recommendedActionType,
      recommendedActions: input.recommendedActions as any,
    },
  })
  return forcedRowToItem(data)
}

export async function markForcedSuccessDelivered(input: {
  id: string
  deliveredActionType: ForcedSuccessItem["deliveredActionType"]
  deliveredBy: string
  draftId?: string
}): Promise<ForcedSuccessItem | null> {
  const data = await prisma.forcedSuccessItem
    .update({
      where: { id: input.id },
      data: {
        deliveredActionType: input.deliveredActionType ?? null,
        deliveredAt: new Date(),
        deliveredBy: input.deliveredBy,
        draftId: input.draftId ?? null,
        blocked: false,
        blockedReason: null,
      },
    })
    .catch(() => null)
  return data ? forcedRowToItem(data) : null
}

export async function overrideForcedSuccessBlock(input: { id: string; actorId: string }): Promise<ForcedSuccessItem | null> {
  const data = await prisma.forcedSuccessItem
    .update({
      where: { id: input.id },
      data: {
        blocked: false,
        blockedReason: null,
        deliveredAt: new Date(),
        deliveredBy: input.actorId,
      },
    })
    .catch(() => null)
  return data ? forcedRowToItem(data) : null
}
