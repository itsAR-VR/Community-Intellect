import "server-only"

import type { ChatMessage, ChatThread, TenantId } from "@/lib/types"
import {
  appendChatMessage,
  createChatThread as dbCreateChatThread,
  getChatThreadById as dbGetChatThreadById,
  getChatThreads as dbGetChatThreads,
} from "@/lib/data"
import { requireWhoami } from "@/lib/auth/whoami"

export async function getChatThreads(tenantId: TenantId): Promise<ChatThread[]> {
  return dbGetChatThreads(tenantId)
}

export async function getChatThreadById(id: string): Promise<ChatThread | null> {
  const whoami = await requireWhoami()
  for (const t of whoami.tenants) {
    const thread = await dbGetChatThreadById(t.id, id)
    if (thread) return thread
  }
  return null
}

export async function createChatThread(
  tenantId: TenantId,
  title: string,
  context?: ChatThread["context"],
): Promise<ChatThread> {
  return dbCreateChatThread({ tenantId, title, context })
}

export async function addMessageToThread(
  threadId: string,
  message: Omit<ChatMessage, "id" | "createdAt">,
): Promise<ChatMessage> {
  const whoami = await requireWhoami()
  for (const t of whoami.tenants) {
    const thread = await dbGetChatThreadById(t.id, threadId)
    if (!thread) continue
    return appendChatMessage({
      tenantId: t.id,
      threadId,
      role: message.role,
      content: message.content,
      evidence: message.evidence,
      suggestedActions: message.suggestedActions,
    })
  }

  throw new Error("Thread not found")
}
