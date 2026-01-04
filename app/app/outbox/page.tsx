import { getMembers, getOutboundMessagesForTenant, getSlackDmThreadsForTenant } from "@/lib/data"
import { CLUB_TENANT_ID } from "@/lib/club"
import { OutboxClient } from "./outbox-client"

export default async function OutboxPage() {
  const [members, messages, dmThreads] = await Promise.all([
    getMembers(CLUB_TENANT_ID),
    getOutboundMessagesForTenant(CLUB_TENANT_ID),
    getSlackDmThreadsForTenant(CLUB_TENANT_ID),
  ])

  return <OutboxClient members={members} messages={messages} dmThreads={dmThreads} />
}

