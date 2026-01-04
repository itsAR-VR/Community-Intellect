import "server-only"

import { randomUUID } from "crypto"
import type { ChatMessage, ChatThread, TenantId } from "@/lib/types"
import { dateToIso, nullToUndefined } from "@/lib/data/_utils"
import { Prisma } from "@/lib/generated/prisma/client"
import { prisma } from "@/lib/prisma"

function threadRowToThread(row: any): Omit<ChatThread, "messages"> {
  return {
    id: row.id,
    tenantId: row.tenantId,
    title: row.title,
    context: nullToUndefined(row.context) as ChatThread["context"] | undefined,
    createdAt: dateToIso(row.createdAt),
    updatedAt: dateToIso(row.updatedAt),
  }
}

function messageRowToMessage(row: any): ChatMessage {
  return {
    id: row.id,
    role: row.role,
    content: row.content,
    evidence: nullToUndefined(row.evidence),
    suggestedActions: nullToUndefined(row.suggestedActions) as ChatMessage["suggestedActions"] | undefined,
    createdAt: dateToIso(row.createdAt),
  }
}

export async function getChatThreads(tenantId: TenantId): Promise<ChatThread[]> {
  const threads = await prisma.chatThread.findMany({
    where: { tenantId },
    orderBy: { updatedAt: "desc" },
    take: 50,
    include: { messages: { orderBy: { createdAt: "asc" } } },
  })

  return threads.map((t) => ({
    ...threadRowToThread(t),
    messages: (t.messages ?? []).map(messageRowToMessage),
  }))
}

export async function getChatThreadById(tenantId: TenantId, threadId: string): Promise<ChatThread | null> {
  const thread = await prisma.chatThread.findFirst({
    where: { tenantId, id: threadId },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  })
  if (!thread) return null

  return { ...threadRowToThread(thread), messages: (thread.messages ?? []).map(messageRowToMessage) }
}

export async function createChatThread(input: {
  tenantId: TenantId
  createdBy: string
  title: string
  context?: ChatThread["context"]
}): Promise<ChatThread> {
  const now = new Date()
  const data = await prisma.chatThread.create({
    data: {
      id: randomUUID(),
      tenantId: input.tenantId,
      title: input.title,
      context: input.context ? (input.context as Prisma.InputJsonValue) : undefined,
      createdBy: input.createdBy,
      createdAt: now,
      updatedAt: now,
    },
  })
  return { ...threadRowToThread(data), messages: [] }
}

export async function appendChatMessage(input: {
  tenantId: TenantId
  threadId: string
  role: ChatMessage["role"]
  content: string
  evidence?: ChatMessage["evidence"]
  suggestedActions?: ChatMessage["suggestedActions"]
}): Promise<ChatMessage> {
  const now = new Date()
  const [message] = await prisma.$transaction([
    prisma.chatMessage.create({
      data: {
        id: randomUUID(),
        tenantId: input.tenantId,
        threadId: input.threadId,
        role: input.role,
        content: input.content,
        evidence: input.evidence ? (input.evidence as Prisma.InputJsonValue) : undefined,
        suggestedActions: input.suggestedActions ? (input.suggestedActions as unknown as Prisma.InputJsonValue) : undefined,
        createdAt: now,
      },
    }),
    prisma.chatThread.update({
      where: { id: input.threadId },
      data: { updatedAt: now },
      select: { id: true },
    }),
  ])

  return messageRowToMessage(message)
}
