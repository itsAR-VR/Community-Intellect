import type { TenantId } from "@/lib/types"
import { getForcedSuccessItems, getMembers } from "@/lib/data"
import { ForcedSuccessClient } from "./forced-success-client"

export default async function ForcedSuccessPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params
  const typedTenantId = tenantId as TenantId
  const [members, items] = await Promise.all([getMembers(typedTenantId), getForcedSuccessItems(typedTenantId)])
  return <ForcedSuccessClient tenantId={typedTenantId} members={members} items={items} />
}
