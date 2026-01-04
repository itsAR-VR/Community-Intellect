import "server-only"

import type { Pod, TenantId } from "@/lib/types"
import { dateToIso } from "@/lib/data/_utils"
import { prisma } from "@/lib/prisma"

function podRowToPod(row: any): Pod {
  return {
    id: row.id,
    tenantId: row.tenantId,
    name: row.name,
    memberIds: row.memberIds ?? [],
    monthlyGoalsPromptSent: row.monthlyGoalsPromptSent,
    monthlyGoalsReceived: row.monthlyGoalsReceived ?? [],
    receiptsShared: row.receiptsShared ?? [],
    quietMemberIds: row.quietMemberIds ?? [],
    createdAt: dateToIso(row.createdAt),
  }
}

export async function getPods(tenantId: TenantId): Promise<Pod[]> {
  const data = await prisma.pod.findMany({ where: { tenantId }, orderBy: { createdAt: "desc" } })
  return data.map(podRowToPod)
}

export async function createPod(input: { id: string; tenantId: TenantId; name: string; memberIds: string[] }): Promise<Pod> {
  const data = await prisma.pod.create({
    data: {
      id: input.id,
      tenantId: input.tenantId,
      name: input.name,
      memberIds: input.memberIds,
      monthlyGoalsPromptSent: false,
      monthlyGoalsReceived: [],
      receiptsShared: [],
      quietMemberIds: [],
    },
  })
  return podRowToPod(data)
}
