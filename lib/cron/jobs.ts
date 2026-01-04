import "server-only"

import { randomUUID, createHash } from "crypto"
import { Prisma } from "@/lib/generated/prisma/client"
import { prisma } from "@/lib/prisma"
import type { UserRole } from "@/lib/types"

function getNested(obj: any, path: string[]): any {
  let cur = obj
  for (const p of path) {
    if (!cur || typeof cur !== "object") return undefined
    cur = cur[p]
  }
  return cur
}

function cadenceToDays(cadence: string): number {
  switch (cadence) {
    case "weekly":
      return 7
    case "biweekly":
      return 14
    case "monthly":
      return 30
    case "quarterly":
      return 91
    default:
      return 7
  }
}

async function listTenantIds(): Promise<string[]> {
  const data = await prisma.tenant.findMany({ select: { id: true } })
  return data.map((t) => t.id)
}

async function getTenantSettingsJson(tenantId: string): Promise<Record<string, unknown>> {
  const data = await prisma.tenantSettings.findUnique({ where: { tenantId }, select: { settings: true } })
  return (data?.settings ?? {}) as Record<string, unknown>
}

async function createAuditLogEntry(input: {
  tenantId: string
  type: string
  actorLabel: string
  actorRole: UserRole
  memberId?: string
  details?: Record<string, unknown>
}) {
  await prisma.auditLog.create({
    data: {
      id: randomUUID(),
      tenantId: input.tenantId,
      type: input.type,
      actorId: "system",
      actorRole: input.actorRole,
      actorLabel: input.actorLabel,
      memberId: input.memberId ?? null,
      details: (input.details ?? {}) as Prisma.InputJsonValue,
    },
  })
}

export async function runSurveyAutoSend(input: { nowIso: string; dryRun: boolean }) {
  const tenants = await listTenantIds()
  const now = Date.parse(input.nowIso)

  const totals = { tenantsScanned: tenants.length, tenantsEnabled: 0, membersDue: 0, surveysSent: 0, errors: 0 }

  for (const tenantId of tenants) {
    const settings = await getTenantSettingsJson(tenantId).catch(() => null)
    if (!settings) {
      totals.errors += 1
      continue
    }

    const enabled = getNested(settings, ["automation", "surveys", "enabled"]) === true
    if (!enabled) continue
    totals.tenantsEnabled += 1

    const cadence = (getNested(settings, ["automation", "surveys", "cadence"]) as string | undefined) ?? "weekly"
    const maxPerRunRaw = getNested(settings, ["automation", "surveys", "maxPerRun"])
    const maxPerRun = Number.isFinite(Number(maxPerRunRaw)) ? Math.max(0, Number(maxPerRunRaw)) : 50
    const dueAfterDays = cadenceToDays(cadence)
    const cutoffIso = new Date(now - dueAfterDays * 24 * 60 * 60 * 1000).toISOString()

    const [members, surveys] = await Promise.all([
      prisma.member.findMany({ where: { tenantId, status: "active" }, select: { id: true } }),
      prisma.survey.findMany({ where: { tenantId }, select: { id: true, memberId: true, lastSentAt: true } }),
    ])

    const byMember = new Map<string, { id: string; lastSentAt: string | null }>()
    for (const row of surveys) {
      byMember.set(row.memberId, { id: row.id, lastSentAt: row.lastSentAt ? row.lastSentAt.toISOString() : null })
    }

    const dueMembers: string[] = []
    for (const m of members) {
      const memberId = m.id
      const existing = byMember.get(memberId)
      if (!existing) {
        dueMembers.push(memberId)
        continue
      }
      if (!existing.lastSentAt) {
        dueMembers.push(memberId)
        continue
      }
      if (existing.lastSentAt <= cutoffIso) dueMembers.push(memberId)
    }

    const due = dueMembers.slice(0, maxPerRun)
    totals.membersDue += due.length

    for (const memberId of due) {
      if (input.dryRun) continue

      const existing = byMember.get(memberId)
      if (existing) {
        try {
          await prisma.survey.update({ where: { id: existing.id }, data: { cadence, lastSentAt: new Date(input.nowIso) } })
        } catch {
          totals.errors += 1
          continue
        }
      } else {
        try {
          await prisma.survey.create({
            data: {
              id: `sur_${randomUUID().slice(0, 8)}`,
              tenantId,
              memberId,
              cadence,
              lastSentAt: new Date(input.nowIso),
              lastCompletedAt: null,
              completionRate: 0,
              responses: [],
            },
          })
        } catch {
          totals.errors += 1
          continue
        }
      }

      totals.surveysSent += 1
      await createAuditLogEntry({
        tenantId,
        type: "survey_sent",
        actorLabel: "Cron",
        actorRole: "admin",
        memberId,
        details: { cadence, source: "cron" },
      }).catch(() => {
        totals.errors += 1
      })
    }
  }

  return totals
}

export async function runProgrammingReminders(input: {
  nowIso: string
  runKey: string
  dryRun: boolean
}) {
  const tenants = await listTenantIds()
  const nowMs = Date.parse(input.nowIso)
  const next24hIso = new Date(nowMs + 24 * 60 * 60 * 1000).toISOString()

  const totals = { tenantsScanned: tenants.length, tenantsEnabled: 0, remindersQueued: 0, errors: 0 }

  for (const tenantId of tenants) {
    const settings = await getTenantSettingsJson(tenantId).catch(() => null)
    if (!settings) {
      totals.errors += 1
      continue
    }

    const enabled = getNested(settings, ["automation", "programmingReminders", "enabled"]) === true
    if (!enabled) continue
    totals.tenantsEnabled += 1

    let groups: { id: string; name: string; nextSessionAt: Date | null }[] = []
    try {
      groups = await prisma.mastermindGroup.findMany({
        where: { tenantId, nextSessionAt: { gte: new Date(input.nowIso), lte: new Date(next24hIso) } },
        select: { id: true, name: true, nextSessionAt: true },
      })
    } catch {
      totals.errors += 1
      continue
    }

    for (const g of groups) {
      const groupId = g.id
      const sessionAt = g.nextSessionAt?.toISOString() ?? "unknown"
      const hash = createHash("sha1").update(["programming-reminder", tenantId, input.runKey, groupId].join("|")).digest("hex").slice(0, 12)
      const notificationId = `ntf_prg_${hash}`

      totals.remindersQueued += 1
      if (input.dryRun) continue

      try {
        await prisma.notification.create({
          data: {
            id: notificationId,
            tenantId,
            type: "programming_reminder",
            title: `Upcoming: ${g.name ?? "Mastermind"}`,
            description: `Next session in the next 24h (starts at ${sessionAt}).`,
            memberId: null,
            actionUrl: "/app/programming",
            read: false,
          },
        })
      } catch (err) {
        // If we already queued this reminder for this runKey, treat as success.
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") continue
        totals.errors += 1
      }
    }
  }

  return totals
}

export async function runDailyRollups(input: { nowIso: string }) {
  const tenants = await listTenantIds()

  const totals = {
    tenantsScanned: tenants.length,
    errors: 0,
    byTenant: {} as Record<
      string,
      {
        totalMembers: number
        activeMembers: number
        atRiskMembers: number
        introsThisMonth: number
      }
    >,
  }

  for (const tenantId of tenants) {
    try {
      const startOfMonth = new Date(input.nowIso)
      startOfMonth.setUTCDate(1)
      startOfMonth.setUTCHours(0, 0, 0, 0)

      const [totalMembers, activeMembers, atRiskMembers, introCount] = await Promise.all([
        prisma.member.count({ where: { tenantId } }),
        prisma.member.count({ where: { tenantId, status: "active" } }),
        prisma.member.count({ where: { tenantId, riskTier: { in: ["yellow", "red"] } } }),
        prisma.introRecord.count({ where: { tenantId, createdAt: { gte: startOfMonth } } }),
      ])

      totals.byTenant[tenantId] = {
        totalMembers,
        activeMembers,
        atRiskMembers,
        introsThisMonth: introCount,
      }
    } catch {
      totals.errors += 1
    }
  }

  return totals
}
