import { mockChatThreads } from "../mock-data"
import type { ChatThread, ChatMessage, TenantId } from "../types"

export async function getChatThreads(tenantId: TenantId): Promise<ChatThread[]> {
  await new Promise((resolve) => setTimeout(resolve, 100))
  return mockChatThreads.filter((t) => t.tenantId === tenantId)
}

export async function getChatThreadById(id: string): Promise<ChatThread | null> {
  await new Promise((resolve) => setTimeout(resolve, 50))
  return mockChatThreads.find((t) => t.id === id) ?? null
}

export async function createChatThread(
  tenantId: TenantId,
  title: string,
  context?: ChatThread["context"],
): Promise<ChatThread> {
  await new Promise((resolve) => setTimeout(resolve, 100))
  return {
    id: `chat_${Date.now()}`,
    tenantId,
    title,
    context,
    messages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

export async function addMessageToThread(
  threadId: string,
  message: Omit<ChatMessage, "id" | "createdAt">,
): Promise<ChatMessage> {
  await new Promise((resolve) => setTimeout(resolve, 50))
  return {
    ...message,
    id: `msg_${Date.now()}`,
    createdAt: new Date().toISOString(),
  }
}
