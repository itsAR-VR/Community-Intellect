import type { TenantId } from "@/lib/types"
import { getMembers } from "@/lib/data"
import { MembersClient } from "./members-client"

export default async function MembersPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params
  const typedTenantId = tenantId as TenantId
  const members = await getMembers(typedTenantId)
  return <MembersClient tenantId={typedTenantId} members={members} />
}
