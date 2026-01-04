import "server-only"

import type { Pod, TenantId } from "@/lib/types"
import { getPods as dbGetPods } from "@/lib/data"
import { requireClubAccess } from "@/lib/auth/tenant-access"
import { CLUB_TENANT_ID } from "@/lib/club"

export async function getPods(tenantId: TenantId): Promise<Pod[]> {
  return dbGetPods(tenantId)
}

export async function getPodByMember(memberId: string): Promise<Pod | null> {
  await requireClubAccess()
  const pods = await dbGetPods(CLUB_TENANT_ID)
  return pods.find((p) => p.memberIds.includes(memberId)) ?? null
}

export async function getPodsWithQuietMembers(tenantId: TenantId): Promise<Pod[]> {
  const pods = await getPods(tenantId)
  return pods.filter((p) => p.quietMemberIds.length > 0)
}
