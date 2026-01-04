import "server-only"

import { randomUUID } from "crypto"
import { prisma } from "@/lib/prisma"
import type { ActionType, TenantId, UserRole } from "@/lib/types"
import { generateDraftMessage } from "@/lib/ai/draft-message"
import { createDraft, updateDraft } from "@/lib/data/drafts"
import { enqueueOutboundMessageFromDraft } from "@/lib/data/outbound-messages"
import { evaluateAutosendGate } from "@/lib/messaging/autosend-gate"
import { createAuditEntry } from "@/lib/data/audit"

async function listTenantIds(): Promise<string[]> {
  const data = await prisma.tenant.findMany({ select: { id: true } })
  return data.map((t) => t.id)
}

function pickForcedWeeklyActionType(input: { hasIntro: boolean; hasPerk: boolean; hasResource: boolean }): ActionType {
  if (input.hasIntro) return "intro"
  if (input.hasPerk) return "perk"
  if (input.hasResource) return "resource"
  return "check_in"
}

export async function runGenerateForcedWeeklyDrafts(input: { nowIso: string; dryRun: boolean }) {
  const tenantIds = await listTenantIds()
  const now = new Date(input.nowIso)
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const totals = { tenantsScanned: tenantIds.length, membersDue: 0, draftsCreated: 0, errors: 0 }

  for (const tenantIdRaw of tenantIds) {
    const tenantId = tenantIdRaw as TenantId

    const members = await prisma.member.findMany({
      where: {
        tenantId,
        status: "active",
        contactState: { not: "muted" },
        OR: [{ lastValueDropAt: null }, { lastValueDropAt: { lt: weekAgo } }],
      },
      select: { id: true, lastValueDropAt: true },
      take: 200,
    })

    totals.membersDue += members.length

    for (const m of members) {
      try {
        const [introCount, perkCount, resourceCount] = await Promise.all([
          prisma.introSuggestion.count({
            where: { tenantId, dismissed: false, OR: [{ memberAId: m.id }, { memberBId: m.id }] },
          }),
          prisma.perkRecommendation.count({
            where: { tenantId, memberId: m.id, dismissed: false, deliveredAt: null },
          }),
          prisma.resource.count({ where: { tenantId } }),
        ])

        const actionType = pickForcedWeeklyActionType({
          hasIntro: introCount > 0,
          hasPerk: perkCount > 0,
          hasResource: resourceCount > 0,
        })

        const ai = await generateDraftMessage({ memberId: m.id, actionType })

        if (input.dryRun) continue

        const draft = await createDraft({
          id: `drf_${randomUUID().slice(0, 10)}`,
          tenantId,
          memberId: m.id,
          actionType,
          content: ai.content,
          autosendEligible: ai.autosendEligible,
          blockedReasons: ai.blockedReasons,
          sendRecommendation: ai.sendRecommendation,
          impactScore: 60,
          editorId: "system",
        })

        totals.draftsCreated += 1

        await createAuditEntry({
          tenantId,
          type: "draft_created",
          actorId: "system",
          actor: "System",
          actorRole: "admin",
          memberId: m.id,
          details: { draftId: draft.id, source: "forced_weekly" },
        }).catch(() => null)
      } catch {
        totals.errors += 1
      }
    }
  }

  return totals
}

function normalizeActionType(raw: unknown): ActionType {
  const allowed: ActionType[] = [
    "intro",
    "perk",
    "resource",
    "workshop_invite",
    "check_in",
    "mastermind_invite",
    "follow_up",
    "escalation",
  ]
  return allowed.includes(raw as any) ? (raw as ActionType) : "follow_up"
}

export async function runGenerateTriggerBasedDrafts(input: { nowIso: string; dryRun: boolean }) {
  const tenantIds = await listTenantIds()
  const totals = { tenantsScanned: tenantIds.length, opportunitiesScanned: 0, draftsCreated: 0, errors: 0 }

  for (const tenantIdRaw of tenantIds) {
    const tenantId = tenantIdRaw as TenantId
    const opps = await prisma.opportunity.findMany({
      where: { tenantId, dismissed: false },
      orderBy: [{ urgency: "desc" }, { confidence: "desc" }],
      take: 200,
    })
    totals.opportunitiesScanned += opps.length

    for (const o of opps) {
      try {
        const existing = await prisma.messageDraft.findFirst({
          where: { tenantId, generatedFromOpportunityId: o.id },
          select: { id: true },
        })
        if (existing) continue

        const recs = Array.isArray(o.recommendedActions) ? (o.recommendedActions as any[]) : []
        const actionType = normalizeActionType(recs[0]?.type)
        const ai = await generateDraftMessage({ memberId: o.memberId, actionType })

        if (input.dryRun) continue

        const draft = await createDraft({
          id: `drf_${randomUUID().slice(0, 10)}`,
          tenantId,
          memberId: o.memberId,
          actionType,
          content: ai.content,
          autosendEligible: ai.autosendEligible,
          blockedReasons: ai.blockedReasons,
          sendRecommendation: ai.sendRecommendation,
          impactScore: 70,
          generatedFromOpportunityId: o.id,
          editorId: "system",
        })

        totals.draftsCreated += 1

        await createAuditEntry({
          tenantId,
          type: "draft_created",
          actorId: "system",
          actor: "System",
          actorRole: "admin",
          memberId: o.memberId,
          details: { draftId: draft.id, opportunityId: o.id, source: "trigger_based" },
        }).catch(() => null)
      } catch {
        totals.errors += 1
      }
    }
  }

  return totals
}

export async function runAutoSendDrafts(input: { nowIso: string; dryRun: boolean }) {
  const tenantIds = await listTenantIds()
  const now = new Date(input.nowIso)

  const totals = { tenantsScanned: tenantIds.length, scanned: 0, sent: 0, blocked: 0, errors: 0 }

  for (const tenantIdRaw of tenantIds) {
    const tenantId = tenantIdRaw as TenantId

    const drafts = await prisma.messageDraft.findMany({
      where: { tenantId, status: "pending", autosendEligible: true, sendRecommendation: "send" },
      orderBy: { createdAt: "asc" },
      take: 200,
    })
    totals.scanned += drafts.length

    for (const d of drafts) {
      try {
        const gate = await evaluateAutosendGate({ tenantId, memberId: d.memberId, now })
        if (!gate.ok) {
          totals.blocked += 1
          continue
        }

        totals.sent += 1
        if (input.dryRun) continue

        const updated = await updateDraft(
          d.id,
          { status: "sent", sentAt: input.nowIso, sentBy: "system" },
          "system",
        )
        if (!updated) continue

        await enqueueOutboundMessageFromDraft({ tenantId, memberId: updated.memberId, draft: updated, sendAs: "community_manager" })

        await createAuditEntry({
          tenantId,
          type: "outbound_message_enqueued",
          actorId: "system",
          actor: "System",
          actorRole: "admin" as UserRole,
          memberId: updated.memberId,
          details: { draftId: updated.id, source: "autosend" },
        }).catch(() => null)
      } catch {
        totals.errors += 1
      }
    }
  }

  return totals
}

