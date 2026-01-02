import "server-only"

import { randomUUID } from "crypto"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { ChatMessage, ChatThread, TenantId } from "@/lib/types"
import { nullToUndefined } from "@/lib/data/_utils"

function threadRowToThread(row: any): Omit<ChatThread, "messages"> {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    title: row.title,
    context: nullToUndefined(row.context) as ChatThread["context"] | undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function messageRowToMessage(row: any): ChatMessage {
  return {
    id: row.id,
    role: row.role,
    content: row.content,
    evidence: nullToUndefined(row.evidence),
    suggestedActions: nullToUndefined(row.suggested_actions) as ChatMessage["suggestedActions"] | undefined,
    createdAt: row.created_at,
  }
}

export async function getChatThreads(tenantId: TenantId): Promise<ChatThread[]> {
  const supabase = await createSupabaseServerClient()

  const { data: threads, error: threadsError } = await supabase
    .from("chat_threads")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("updated_at", { ascending: false })
    .limit(50)
  if (threadsError) throw threadsError

  const threadIds = (threads ?? []).map((t) => t.id)
  if (threadIds.length === 0) return []

  const { data: messages, error: messagesError } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("tenant_id", tenantId)
    .in("thread_id", threadIds)
    .order("created_at", { ascending: true })
  if (messagesError) throw messagesError

  const byThreadId = new Map<string, ChatMessage[]>()
  for (const msg of messages ?? []) {
    const arr = byThreadId.get(msg.thread_id) ?? []
    arr.push(messageRowToMessage(msg))
    byThreadId.set(msg.thread_id, arr)
  }

  return (threads ?? []).map((t) => ({
    ...threadRowToThread(t),
    messages: byThreadId.get(t.id) ?? [],
  }))
}

export async function getChatThreadById(tenantId: TenantId, threadId: string): Promise<ChatThread | null> {
  const supabase = await createSupabaseServerClient()
  const { data: thread, error: threadError } = await supabase
    .from("chat_threads")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("id", threadId)
    .maybeSingle()
  if (threadError) throw threadError
  if (!thread) return null

  const { data: messages, error: messagesError } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true })
  if (messagesError) throw messagesError

  return { ...threadRowToThread(thread), messages: (messages ?? []).map(messageRowToMessage) }
}

export async function createChatThread(input: {
  tenantId: TenantId
  title: string
  context?: ChatThread["context"]
}): Promise<ChatThread> {
  const supabase = await createSupabaseServerClient()
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from("chat_threads")
    .insert({
      id: randomUUID(),
      tenant_id: input.tenantId,
      title: input.title,
      context: input.context ?? null,
      created_at: now,
      updated_at: now,
    })
    .select("*")
    .single()
  if (error) throw error
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
  const supabase = await createSupabaseServerClient()
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from("chat_messages")
    .insert({
      id: randomUUID(),
      tenant_id: input.tenantId,
      thread_id: input.threadId,
      role: input.role,
      content: input.content,
      evidence: input.evidence ?? null,
      suggested_actions: input.suggestedActions ?? null,
      created_at: now,
    })
    .select("*")
    .single()
  if (error) throw error

  await supabase.from("chat_threads").update({ updated_at: now }).eq("id", input.threadId)

  return messageRowToMessage(data)
}
