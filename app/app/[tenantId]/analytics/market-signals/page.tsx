import type { TenantId } from "@/lib/types"
import { getMembers, getSignalsForTenant } from "@/lib/data"
import { MarketSignalsClient } from "./market-signals-client"

export default async function MarketSignalsPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params
  const typedTenantId = tenantId as TenantId
  const [members, signals] = await Promise.all([getMembers(typedTenantId), getSignalsForTenant(typedTenantId)])
  return <MarketSignalsClient tenantId={typedTenantId} members={members} signals={signals} />
}
