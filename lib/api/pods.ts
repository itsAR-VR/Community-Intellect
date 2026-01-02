import "server-only"

import type { Pod, TenantId } from "@/lib/types"
import { getPods as dbGetPods } from "@/lib/data"
import { requireWhoami } from "@/lib/auth/whoami"

export async function getPods(tenantId: TenantId): Promise<Pod[]> {
  return dbGetPods(tenantId)
}

export async function getPodByMember(memberId: string): Promise<Pod | null> {
  const whoami = await requireWhoami()
  const results = await Promise.all(whoami.tenants.map((t) => dbGetPods(t.id)))
  const pods = results.flat()
  return pods.find((p) => p.memberIds.includes(memberId)) ?? null
}

export async function getPodsWithQuietMembers(tenantId: TenantId): Promise<Pod[]> {
  const pods = await getPods(tenantId)
  return pods.filter((p) => p.quietMemberIds.length > 0)
}
