import { getMemberById as getMockMemberById, getMembersByTenant } from "../mock-data"
import type { Member, TenantId } from "../types"

export async function getMembers(tenantId: TenantId): Promise<Member[]> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 100))
  return getMembersByTenant(tenantId)
}

export async function getMemberById(id: string): Promise<Member | null> {
  await new Promise((resolve) => setTimeout(resolve, 50))
  return getMockMemberById(id) ?? null
}

export async function updateMember(id: string, updates: Partial<Member>): Promise<Member | null> {
  await new Promise((resolve) => setTimeout(resolve, 100))
  const member = getMockMemberById(id)
  if (!member) return null
  // In real implementation, this would update the database
  return { ...member, ...updates, updatedAt: new Date().toISOString() }
}

export async function getMembersNeedingAttention(tenantId: TenantId): Promise<Member[]> {
  const members = await getMembers(tenantId)
  return members
    .filter((m) => m.riskTier === "red" || m.riskTier === "yellow" || m.engagementScore < 40)
    .sort((a, b) => b.riskScore - a.riskScore)
}

export async function getNewMembers(tenantId: TenantId): Promise<Member[]> {
  const members = await getMembers(tenantId)
  return members.filter((m) => m.status === "lead" || m.status === "accepted")
}
