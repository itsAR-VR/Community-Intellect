import "server-only"

import { prisma } from "@/lib/prisma"
import type { TenantId } from "@/lib/types"

const REQUIRED_FACT_CATEGORIES = ["goal", "bottleneck", "stack"] as const

export async function getMemberIntakeCompleteness(input: { tenantId: TenantId; memberId: string }): Promise<{
  ok: boolean
  missing: string[]
}> {
  const member = await prisma.member.findFirst({
    where: { tenantId: input.tenantId, id: input.memberId },
    select: { onboarding: true },
  })
  if (!member) return { ok: false, missing: ["member_not_found"] }

  const onboarding = (member.onboarding ?? {}) as any
  const missing: string[] = []

  if (onboarding.intakeCompleted !== true) missing.push("onboarding.intakeCompleted")

  const grouped = await prisma.fact.groupBy({
    by: ["category"],
    where: { tenantId: input.tenantId, memberId: input.memberId },
    _count: { _all: true },
  })
  const countsByCategory = new Map(grouped.map((g) => [g.category, g._count._all]))

  for (const cat of REQUIRED_FACT_CATEGORIES) {
    if ((countsByCategory.get(cat) ?? 0) < 1) missing.push(`facts.${cat}`)
  }

  return { ok: missing.length === 0, missing }
}

