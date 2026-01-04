import "server-only"

import type { MemberWrapped, PersonaCluster, TenantId } from "@/lib/types"
import { getMembers } from "@/lib/data/members"
import { dateToIso } from "@/lib/data/_utils"
import { prisma } from "@/lib/prisma"

function clusterRowToCluster(row: any): PersonaCluster {
  return {
    id: row.id,
    tenantId: row.tenantId,
    name: row.name,
    description: row.description,
    memberIds: row.memberIds ?? [],
    characteristics: row.characteristics ?? [],
    suggestedUses: row.suggestedUses ?? [],
    createdAt: dateToIso(row.createdAt),
  }
}

function wrappedRowToWrapped(row: any): MemberWrapped {
  return {
    memberId: row.memberId,
    period: row.period,
    startSnapshot: row.startSnapshot as any,
    currentSnapshot: row.currentSnapshot as any,
    highlights: row.highlights,
    wins: row.wins ?? [],
    generatedAt: dateToIso(row.generatedAt),
  }
}

export async function getPersonaClusters(tenantId: TenantId): Promise<PersonaCluster[]> {
  const data = await prisma.personaCluster.findMany({ where: { tenantId }, orderBy: { createdAt: "desc" } })
  return data.map(clusterRowToCluster)
}

export async function getWrapped(tenantId: TenantId): Promise<MemberWrapped[]> {
  const data = await prisma.memberWrapped.findMany({ where: { tenantId } })
  return data.map(wrappedRowToWrapped)
}

export async function getMemberWrapped(memberId: string, period: string): Promise<MemberWrapped | null> {
  const data = await prisma.memberWrapped.findFirst({ where: { memberId, period } })
  return data ? wrappedRowToWrapped(data) : null
}

export async function getClubMetrics(tenantId: TenantId): Promise<{
  totalMembers: number
  activeMembers: number
  atRiskMembers: number
  avgEngagement: number
  introsThisMonth: number
  forcedSuccessCompliance: number
}> {
  const members = await getMembers(tenantId)
  const active = members.filter((m) => m.status === "active")
  const atRisk = members.filter((m) => m.riskTier === "red" || m.riskTier === "yellow")

  const avgEngagement =
    active.length > 0 ? Math.round(active.reduce((sum, m) => sum + m.engagementScore, 0) / active.length) : 0

  const startOfMonth = new Date()
  startOfMonth.setUTCDate(1)
  startOfMonth.setUTCHours(0, 0, 0, 0)

  const introCount = await prisma.introRecord.count({ where: { tenantId, createdAt: { gte: startOfMonth } } })

  const monthDay = startOfMonth.toISOString().slice(0, 10)
  const forcedTotal = await prisma.forcedSuccessItem.count({ where: { tenantId, weekOf: { gte: monthDay } } })
  const forcedDelivered = await prisma.forcedSuccessItem.count({
    where: { tenantId, weekOf: { gte: monthDay }, deliveredAt: { not: null } },
  })

  const forcedSuccessCompliance =
    (forcedTotal ?? 0) > 0 ? Math.round(((forcedDelivered ?? 0) / (forcedTotal ?? 1)) * 100) : 100

  return {
    totalMembers: members.length,
    activeMembers: active.length,
    atRiskMembers: atRisk.length,
    avgEngagement,
    introsThisMonth: introCount ?? 0,
    forcedSuccessCompliance,
  }
}
