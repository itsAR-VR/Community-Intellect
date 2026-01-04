import { getMembers, getSignalsForTenant } from "@/lib/data"
import { CLUB_TENANT_ID } from "@/lib/club"
import { MarketSignalsClient } from "./market-signals-client"

export default async function MarketSignalsPage() {
  const [members, signals] = await Promise.all([getMembers(CLUB_TENANT_ID), getSignalsForTenant(CLUB_TENANT_ID)])
  return <MarketSignalsClient members={members} signals={signals} />
}
