import "server-only"

import { prisma } from "@/lib/prisma"
import type { TenantId } from "@/lib/types"

type SlackEventCallbackPayload = {
  type: "event_callback"
  team_id: string
  event_id: string
  event_time?: number
  event?: {
    type?: string
    subtype?: string
    channel?: string
    channel_type?: string
    user?: string
    bot_id?: string
    ts?: string
    event_ts?: string
  }
}

async function listTenantIds(): Promise<string[]> {
  const data = await prisma.tenant.findMany({ select: { id: true } })
  return data.map((t) => t.id)
}

function toDateFromSlackTs(ts?: string | null): Date | null {
  if (!ts) return null
  const n = Number(ts)
  if (!Number.isFinite(n)) return null
  return new Date(n * 1000)
}

export async function runProcessSlackEvents(input: { nowIso: string; dryRun: boolean }) {
  const now = new Date(input.nowIso)
  const tenantIds = await listTenantIds()

  const totals = { tenantsScanned: tenantIds.length, eventsScanned: 0, eventsProcessed: 0, dmUpdates: 0, errors: 0 }

  const cmUserId = process.env.SLACK_COMMUNITY_MANAGER_USER_ID
  const aiUserId = process.env.SLACK_AI_BOT_USER_ID

  for (const tenantIdRaw of tenantIds) {
    const tenantId = tenantIdRaw as TenantId

    const events = await prisma.slackEvent.findMany({
      where: { tenantId, processedAt: null },
      orderBy: { receivedAt: "asc" },
      take: 500,
    })
    totals.eventsScanned += events.length

    const identities = await prisma.slackIdentity.findMany({ where: { tenantId }, select: { slackUserId: true, memberId: true } })
    const memberIdBySlackUserId = new Map(identities.map((i) => [i.slackUserId, i.memberId]))

    for (const e of events) {
      try {
        const payload = e.payload as unknown as SlackEventCallbackPayload
        const event = payload?.event
        const channelId = event?.channel
        const channelType = event?.channel_type
        const userId = event?.user
        const type = event?.type

        if (type === "message" && channelType === "im" && channelId) {
          const ts = event?.event_ts ?? event?.ts ?? e.eventTs ?? null
          const eventAt = toDateFromSlackTs(ts) ?? now

          const memberIdFromUser = userId ? memberIdBySlackUserId.get(userId) : undefined
          const existingThread = await prisma.slackDmThread.findFirst({
            where: { tenantId, slackChannelId: channelId },
            select: { id: true, memberId: true },
          })
          const memberId = existingThread?.memberId ?? memberIdFromUser

          if (memberId) {
            const isMemberMessage = !!(userId && memberIdFromUser && memberIdFromUser === memberId)
            const isCmMessage = !!(userId && (userId === cmUserId || userId === aiUserId))

            totals.dmUpdates += 1
            if (!input.dryRun) {
              await prisma.slackDmThread.upsert({
                where: { tenantId_slackChannelId: { tenantId, slackChannelId: channelId } },
                create: {
                  id: `sdm_${e.id.slice(0, 10)}`,
                  tenantId,
                  memberId,
                  teamId: e.teamId,
                  slackChannelId: channelId,
                  lastMessageAt: eventAt,
                  lastMemberMessageAt: isMemberMessage ? eventAt : null,
                  lastCmMessageAt: isCmMessage ? eventAt : null,
                  memberRepliedAt: isMemberMessage ? eventAt : null,
                  conversationClosedAt: null,
                  createdAt: now,
                  updatedAt: now,
                },
                update: {
                  memberId,
                  lastMessageAt: eventAt,
                  lastMemberMessageAt: isMemberMessage ? eventAt : undefined,
                  lastCmMessageAt: isCmMessage ? eventAt : undefined,
                  memberRepliedAt: isMemberMessage ? eventAt : undefined,
                  updatedAt: now,
                },
              })
            }
          }
        }

        totals.eventsProcessed += 1
        if (!input.dryRun) {
          await prisma.slackEvent.update({ where: { id: e.id }, data: { processedAt: now, processingError: null } })
        }
      } catch (err) {
        totals.errors += 1
        if (!input.dryRun) {
          await prisma.slackEvent
            .update({
              where: { id: e.id },
              data: { processedAt: now, processingError: err instanceof Error ? err.message : "Slack event processing failed" },
            })
            .catch(() => null)
        }
      }
    }
  }

  return totals
}

