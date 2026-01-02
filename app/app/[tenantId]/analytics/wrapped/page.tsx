import type { TenantId } from "@/lib/types"
import { getMembers, getWrapped } from "@/lib/data"
import { WrappedClient } from "./wrapped-client"

export default async function WrappedPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params
  const typedTenantId = tenantId as TenantId
  const [members, wrapped] = await Promise.all([getMembers(typedTenantId), getWrapped(typedTenantId)])
  return <WrappedClient tenantId={typedTenantId} members={members} wrapped={wrapped} />
}
