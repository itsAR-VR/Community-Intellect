import type { TenantId } from "@/lib/types"
import { getMembers, getOpportunities } from "@/lib/data"
import { OpportunitiesClient } from "./opportunities-client"

export default async function OpportunitiesPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params
  const typedTenantId = tenantId as TenantId
  const [members, opportunities] = await Promise.all([getMembers(typedTenantId), getOpportunities(typedTenantId)])
  return <OpportunitiesClient tenantId={typedTenantId} members={members} opportunities={opportunities} />
}
