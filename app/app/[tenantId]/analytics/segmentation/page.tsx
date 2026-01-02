import type { TenantId } from "@/lib/types"
import { getMembers, getPersonaClusters } from "@/lib/data"
import { SegmentationClient } from "./segmentation-client"

export default async function SegmentationPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params
  const typedTenantId = tenantId as TenantId
  const [members, clusters] = await Promise.all([getMembers(typedTenantId), getPersonaClusters(typedTenantId)])
  return <SegmentationClient tenantId={typedTenantId} members={members} clusters={clusters} />
}
