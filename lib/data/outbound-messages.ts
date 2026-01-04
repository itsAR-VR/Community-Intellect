import "server-only"

import { randomUUID } from "crypto"
import { prisma } from "@/lib/prisma"
import type { TenantId, MessageDraft } from "@/lib/types"

export type OutboundMessageType = "forced_weekly" | "trigger_based"
export type OutboundMessageChannel = "slack_dm"
export type OutboundMessageSendAs = "community_manager" | "ai_bot"

function inferMessageTypeFromDraft(draft: MessageDraft): OutboundMessageType {
  if (draft.generatedFromOpportunityId || draft.generatedFromActionId) return "trigger_based"
  return "forced_weekly"
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

