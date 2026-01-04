import "server-only"

import { randomUUID } from "crypto"
import { prisma } from "@/lib/prisma"
import { dateToIso, dateToIsoOrUndefined, nullToUndefined } from "@/lib/data/_utils"
import type { TenantId, MessageDraft, OutboundMessage, OutboundMessageSendAs, OutboundMessageType } from "@/lib/types"

export type OutboundMessageChannel = "slack_dm"

function inferMessageTypeFromDraft(draft: MessageDraft): OutboundMessageType {
  if (draft.generatedFromOpportunityId || draft.generatedFromActionId) return "trigger_based"
  return "forced_weekly"
}

function rowToOutboundMessage(row: any): OutboundMessage {
  return {
    id: row.id,
    tenantId: row.tenantId as TenantId,
    memberId: row.memberId,
    draftId: nullToUndefined(row.draftId),
    messageType: row.messageType,
    channel: row.channel,
    sendAs: row.sendAs,
    status: row.status,
    body: row.body,
    queuedAt: dateToIso(row.queuedAt),
    scheduledFor: dateToIsoOrUndefined(row.scheduledFor),
    sentAt: dateToIsoOrUndefined(row.sentAt),
    externalId: nullToUndefined(row.externalId),
    threadChannelId: nullToUndefined(row.threadChannelId),
    threadTs: nullToUndefined(row.threadTs),
    error: nullToUndefined(row.error),
    createdAt: dateToIso(row.createdAt),
    updatedAt: dateToIso(row.updatedAt),
  }
}

export async function getOutboundMessagesForTenant(tenantId: TenantId): Promise<OutboundMessage[]> {
  const data = await prisma.outboundMessage.findMany({ where: { tenantId }, orderBy: { queuedAt: "desc" }, take: 500 })
  return data.map(rowToOutboundMessage)
}

export async function enqueueOutboundMessageFromDraft(input: {
  tenantId: TenantId
  memberId: string
  draft: MessageDraft
  sendAs?: OutboundMessageSendAs
  channel?: OutboundMessageChannel
  messageType?: OutboundMessageType
}) {
  const existing = await prisma.outboundMessage.findFirst({
    where: { draftId: input.draft.id },
    select: { id: true, status: true },
  })
  if (existing) return existing

  const messageType = input.messageType ?? inferMessageTypeFromDraft(input.draft)
  const sendAs = input.sendAs ?? "community_manager"
  const channel = input.channel ?? "slack_dm"

  const created = await prisma.outboundMessage.create({
    data: {
      id: `out_${randomUUID().slice(0, 12)}`,
      tenantId: input.tenantId,
      memberId: input.memberId,
      draftId: input.draft.id,
      messageType,
      channel,
      sendAs,
      status: "queued",
      body: input.draft.content,
    },
    select: { id: true, status: true },
  })

  return created
}

export async function updateOutboundMessage(
  id: string,
  patch: Partial<
    Pick<OutboundMessage, "status" | "scheduledFor" | "sentAt" | "externalId" | "error" | "threadChannelId" | "threadTs">
  >,
) {
  const data = await prisma.outboundMessage.update({
    where: { id },
    data: {
      status: patch.status,
      scheduledFor: patch.scheduledFor ? new Date(patch.scheduledFor) : undefined,
      sentAt: patch.sentAt ? new Date(patch.sentAt) : undefined,
      externalId: patch.externalId ?? undefined,
      error: patch.error === "" ? null : patch.error ?? undefined,
      threadChannelId: patch.threadChannelId ?? undefined,
      threadTs: patch.threadTs ?? undefined,
      updatedAt: new Date(),
    },
  })
  return rowToOutboundMessage(data)
}
