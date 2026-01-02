import type { TenantId } from "@/lib/types"
import { getChatThreads, getMembers } from "@/lib/data"
import { AIChatClient } from "./ai-chat-client"

export default async function AIChatPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params
  const typedTenantId = tenantId as TenantId
  const [members, threads] = await Promise.all([getMembers(typedTenantId), getChatThreads(typedTenantId)])
  return <AIChatClient tenantId={typedTenantId} members={members} threads={threads} />
}
