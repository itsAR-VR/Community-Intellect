import "server-only"

import type { ChatMessage, ChatThread, TenantId } from "@/lib/types"
import {
  appendChatMessage,
  createChatThread as dbCreateChatThread,
  getChatThreadById as dbGetChatThreadById,
  getChatThreads as dbGetChatThreads,
} from "@/lib/data"
import { requireClubAccess } from "@/lib/auth/tenant-access"
import { CLUB_TENANT_ID } from "@/lib/club"

export async function getChatThreads(tenantId: TenantId): Promise<ChatThread[]> {
  return dbGetChatThreads(tenantId)
}

export async function getChatThreadById(id: string): Promise<ChatThread | null> {
  await requireClubAccess()
  return dbGetChatThreadById(CLUB_TENANT_ID, id)
}

export async function createChatThread(
  tenantId: TenantId,
  title: string,
  context?: ChatThread["context"],
): Promise<ChatThread> {
  const whoami = await requireClubAccess()
  return dbCreateChatThread({ tenantId, createdBy: whoami.user.id, title, context })
}

export async function addMessageToThread(
  threadId: string,
  message: Omit<ChatMessage, "id" | "createdAt">,
): Promise<ChatMessage> {
  await requireClubAccess()
  const thread = await dbGetChatThreadById(CLUB_TENANT_ID, threadId)
  if (!thread) throw new Error("Thread not found")
  return appendChatMessage({
    tenantId: CLUB_TENANT_ID,
    threadId,
    role: message.role,
    content: message.content,
    evidence: message.evidence,
    suggestedActions: message.suggestedActions,
  })
}
