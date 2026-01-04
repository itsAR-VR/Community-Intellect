import { getMembers, getSignalsForTenant } from "@/lib/data"
import { CLUB_TENANT_ID } from "@/lib/club"
import { AttentionClient } from "./attention-client"

export default async function AttentionPage() {
  const [members, signals] = await Promise.all([getMembers(CLUB_TENANT_ID), getSignalsForTenant(CLUB_TENANT_ID)])
  return <AttentionClient members={members} signals={signals} />
}
