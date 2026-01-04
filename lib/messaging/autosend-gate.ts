import "server-only"

import { prisma } from "@/lib/prisma"
import type { TenantId } from "@/lib/types"

const COOLDOWN_MS = 24 * 60 * 60 * 1000

export async function evaluateAutosendGate(input: {
  tenantId: TenantId
  memberId: string
  now: Date
}): Promise<{ ok: true } | { ok: false; reason: string }> {
  const [member, dm] = await Promise.all([
    prisma.member.findFirst({ where: { tenantId: input.tenantId, id: input.memberId }, select: { contactState: true, lastContactedAt: true } }),
    prisma.slackDmThread.findFirst({ where: { tenantId: input.tenantId, memberId: input.memberId } }),
  ])

  if (!member) return { ok: false, reason: "Member not found" }

  const nowMs = input.now.getTime()

  if (dm) {
    const lastMessageAt = dm.lastMessageAt
    if (!lastMessageAt) return { ok: false, reason: "No last message timestamp" }

    const hasMemberReplied = !!dm.memberRepliedAt
    const isClosed = !!dm.conversationClosedAt || member.contactState === "closed"
    if (!hasMemberReplied && !isClosed) return { ok: false, reason: "Waiting for member reply or close" }

    const delta = nowMs - lastMessageAt.getTime()
    if (delta < COOLDOWN_MS) return { ok: false, reason: "24h cooldown not met" }
    return { ok: true }
  }

  // Fallback (no Slack DM mapping yet): allow only if the CM explicitly marked conversation closed,
  // and we have a last-contact timestamp older than 24h.
  if (member.contactState !== "closed") return { ok: false, reason: "No DM thread mapped" }
  if (!member.lastContactedAt) return { ok: false, reason: "No last contact timestamp" }
  if (nowMs - member.lastContactedAt.getTime() < COOLDOWN_MS) return { ok: false, reason: "24h cooldown not met" }
  return { ok: true }
}

