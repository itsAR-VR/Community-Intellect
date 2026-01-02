import "server-only"

import type { Member, TenantId } from "../types"
import { getMemberById as dbGetMemberById, getMembers as dbGetMembers, updateMember as dbUpdateMember } from "@/lib/data"

export async function getMembers(tenantId: TenantId): Promise<Member[]> {
  return dbGetMembers(tenantId)
}

export async function getMemberById(id: string): Promise<Member | null> {
  return dbGetMemberById(id)
}

export async function updateMember(id: string, updates: Partial<Member>): Promise<Member | null> {
  return dbUpdateMember(id, updates)
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
