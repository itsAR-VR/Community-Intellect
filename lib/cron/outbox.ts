import "server-only"

import { randomUUID } from "crypto"
import { prisma } from "@/lib/prisma"
import type { TenantId } from "@/lib/types"
import { evaluateAutosendGate } from "@/lib/messaging/autosend-gate"

async function listTenantIds(): Promise<string[]> {
  const data = await prisma.tenant.findMany({ select: { id: true } })
  return data.map((t) => t.id)
}

export async function runOutboxEvaluate(input: { nowIso: string; dryRun: boolean }) {
  const tenantIds = await listTenantIds()
  const now = new Date(input.nowIso)

  const totals = { tenantsScanned: tenantIds.length, evaluated: 0, ready: 0, blocked: 0, errors: 0 }

  for (const tenantIdRaw of tenantIds) {
    const tenantId = tenantIdRaw as TenantId
    const messages = await prisma.outboundMessage.findMany({
      where: { tenantId, status: { in: ["queued", "blocked"] } },
      select: { id: true, memberId: true, status: true },
      take: 500,
    })

    for (const msg of messages) {
      totals.evaluated += 1
      try {
        const gate = await evaluateAutosendGate({ tenantId, memberId: msg.memberId, now })
        const nextStatus = gate.ok ? "ready" : "blocked"
        if (gate.ok) totals.ready += 1
        else totals.blocked += 1

        if (input.dryRun) continue
        await prisma.outboundMessage.update({
          where: { id: msg.id },
          data: {
            status: nextStatus,
            scheduledFor: gate.ok ? now : null,
            error: gate.ok ? null : gate.reason,
            updatedAt: now,
          },
        })
      } catch {
        totals.errors += 1
      }
    }
  }

  return totals
}

export async function runOutboxDispatch(input: { nowIso: string; dryRun: boolean }) {
  const tenantIds = await listTenantIds()
  const now = new Date(input.nowIso)

  const totals = { tenantsScanned: tenantIds.length, dispatched: 0, errors: 0 }

  for (const tenantIdRaw of tenantIds) {
    const tenantId = tenantIdRaw as TenantId
    const messages = await prisma.outboundMessage.findMany({
      where: { tenantId, status: "ready", OR: [{ scheduledFor: null }, { scheduledFor: { lte: now } }] },
      select: { id: true, memberId: true, draftId: true, body: true },
      take: 200,
    })

    for (const msg of messages) {
      totals.dispatched += 1
      if (input.dryRun) continue

      try {
        await prisma.$transaction([
          prisma.outboundMessage.update({
            where: { id: msg.id },
            data: {
              status: "sent",
              sentAt: now,
              externalId: `simulated:${msg.id}`,
              error: null,
              updatedAt: now,
            },
          }),
          prisma.interactionLog.create({
            data: {
              id: randomUUID(),
              tenantId,
              memberId: msg.memberId,
              type: "dm",
              channel: "slack",
              summary: msg.body.slice(0, 180),
              draftId: msg.draftId ?? null,
              createdBy: "system",
              createdAt: now,
            },
          }),
          prisma.member.update({
            where: { id: msg.memberId },
            data: { lastContactedAt: now, lastValueDropAt: now, updatedAt: now },
          }),
          prisma.slackDmThread.updateMany({
            where: { tenantId, memberId: msg.memberId },
            data: { lastMessageAt: now, lastCmMessageAt: now, updatedAt: now },
          }),
        ])
      } catch {
        totals.errors += 1
        await prisma.outboundMessage
          .update({
            where: { id: msg.id },
            data: { status: "error", error: "Dispatch failed", updatedAt: now },
          })
          .catch(() => null)
      }
    }
  }

  return totals
}
