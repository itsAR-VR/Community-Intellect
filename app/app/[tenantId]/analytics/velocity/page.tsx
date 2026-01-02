import type { TenantId } from "@/lib/types"
import { getMembers } from "@/lib/data"
import { VelocityClient } from "./velocity-client"

export default async function VelocityPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params
  const typedTenantId = tenantId as TenantId
  const members = await getMembers(typedTenantId)
  return <VelocityClient tenantId={typedTenantId} members={members} />
}
