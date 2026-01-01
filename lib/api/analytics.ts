import { mockPersonaClusters, mockMembers } from "../mock-data"
import type { PersonaCluster, MemberWrapped, TenantId } from "../types"

export async function getPersonaClusters(tenantId: TenantId): Promise<PersonaCluster[]> {
  await new Promise((resolve) => setTimeout(resolve, 100))
  return mockPersonaClusters.filter((c) => c.tenantId === tenantId)
}

export async function getMemberWrapped(memberId: string, period: string): Promise<MemberWrapped | null> {
  await new Promise((resolve) => setTimeout(resolve, 200))
  const member = mockMembers.find((m) => m.id === memberId)
  if (!member) return null

  // Generate wrapped data based on member info
  return {
    memberId,
    period,
    startSnapshot: {
      goals: ["Initial goal"],
      bottlenecks: ["Initial challenge"],
      riskTier: "green",
    },
    currentSnapshot: {
      goals: member.tags,
      bottlenecks: [],
      riskTier: member.riskTier,
    },
    highlights: {
      introsReceived: Math.floor(Math.random() * 10) + 1,
      perksUsed: Math.floor(Math.random() * 5),
      eventsAttended: Math.floor(Math.random() * 12) + 2,
      resourcesAccessed: Math.floor(Math.random() * 20) + 5,
      sentimentTrend: member.riskTier === "green" ? "improving" : member.riskTier === "red" ? "declining" : "stable",
    },
    wins: ["Achieved growth milestone", "Made valuable connections"],
    generatedAt: new Date().toISOString(),
  }
}

export async function getClubMetrics(tenantId: TenantId): Promise<{
  totalMembers: number
  activeMembers: number
  atRiskMembers: number
  avgEngagement: number
  introsThisMonth: number
  forcedSuccessCompliance: number
}> {
  await new Promise((resolve) => setTimeout(resolve, 100))
  const members = mockMembers.filter((m) => m.tenantId === tenantId)
  const active = members.filter((m) => m.status === "active")
  const atRisk = members.filter((m) => m.riskTier === "red" || m.riskTier === "yellow")

  return {
    totalMembers: members.length,
    activeMembers: active.length,
    atRiskMembers: atRisk.length,
    avgEngagement: Math.round(active.reduce((sum, m) => sum + m.engagementScore, 0) / active.length),
    introsThisMonth: 12,
    forcedSuccessCompliance: 85,
  }
}
