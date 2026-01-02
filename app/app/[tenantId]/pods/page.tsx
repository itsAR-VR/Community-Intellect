import type { TenantId } from "@/lib/types"
import { getMembers, getPods } from "@/lib/data"
import { PodsClient } from "./pods-client"

export default async function PodsPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params
  const typedTenantId = tenantId as TenantId
  const [members, pods] = await Promise.all([getMembers(typedTenantId), getPods(typedTenantId)])
  return <PodsClient tenantId={typedTenantId} members={members} pods={pods} />
}
