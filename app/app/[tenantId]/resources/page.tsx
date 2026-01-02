import type { TenantId } from "@/lib/types"
import { getResources } from "@/lib/data"
import { ResourcesClient } from "./resources-client"

export default async function ResourcesPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params
  const typedTenantId = tenantId as TenantId
  const resources = await getResources(typedTenantId)
  return <ResourcesClient tenantId={typedTenantId} resources={resources} />
}
