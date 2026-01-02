import type { TenantId } from "@/lib/types"
import { getDrafts, getMembers } from "@/lib/data"
import { DraftsClient } from "./drafts-client"

export default async function DraftsPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params
  const typedTenantId = tenantId as TenantId
  const [members, drafts] = await Promise.all([getMembers(typedTenantId), getDrafts(typedTenantId, "pending")])
  return <DraftsClient tenantId={typedTenantId} members={members} drafts={drafts} />
}
