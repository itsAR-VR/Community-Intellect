import type { TenantId } from "@/lib/types"
import { getMembers, getSignalsForTenant } from "@/lib/data"
import { AttentionClient } from "./attention-client"

export default async function AttentionPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params
  const typedTenantId = tenantId as TenantId
  const [members, signals] = await Promise.all([getMembers(typedTenantId), getSignalsForTenant(typedTenantId)])
  return <AttentionClient tenantId={typedTenantId} members={members} signals={signals} />
}
