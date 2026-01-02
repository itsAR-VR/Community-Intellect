import "server-only"

import type { MemberWrapped, PersonaCluster, TenantId } from "@/lib/types"
import {
  getClubMetrics as dbGetClubMetrics,
  getMemberWrapped as dbGetMemberWrapped,
  getPersonaClusters as dbGetPersonaClusters,
} from "@/lib/data"

export async function getPersonaClusters(tenantId: TenantId): Promise<PersonaCluster[]> {
  return dbGetPersonaClusters(tenantId)
}

export async function getMemberWrapped(memberId: string, period: string): Promise<MemberWrapped | null> {
  return dbGetMemberWrapped(memberId, period)
}

export async function getClubMetrics(tenantId: TenantId): Promise<{
  totalMembers: number
  activeMembers: number
  atRiskMembers: number
  avgEngagement: number
  introsThisMonth: number
  forcedSuccessCompliance: number
}> {
  return dbGetClubMetrics(tenantId)
}
