import { mockPods } from "../mock-data"
import type { Pod, TenantId } from "../types"

export async function getPods(tenantId: TenantId): Promise<Pod[]> {
  await new Promise((resolve) => setTimeout(resolve, 100))
  return mockPods.filter((p) => p.tenantId === tenantId)
}

export async function getPodByMember(memberId: string): Promise<Pod | null> {
  await new Promise((resolve) => setTimeout(resolve, 50))
  return mockPods.find((p) => p.memberIds.includes(memberId)) ?? null
}

export async function getPodsWithQuietMembers(tenantId: TenantId): Promise<Pod[]> {
  const pods = await getPods(tenantId)
  return pods.filter((p) => p.quietMemberIds.length > 0)
}
