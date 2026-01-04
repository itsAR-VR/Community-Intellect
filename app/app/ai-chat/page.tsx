import { getChatThreads, getMembers } from "@/lib/data"
import { CLUB_TENANT_ID } from "@/lib/club"
import { AIChatClient } from "./ai-chat-client"

export default async function AIChatPage() {
  const [members, threads] = await Promise.all([getMembers(CLUB_TENANT_ID), getChatThreads(CLUB_TENANT_ID)])
  return <AIChatClient members={members} threads={threads} />
}
