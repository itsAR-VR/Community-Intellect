import { getDrafts, getForcedSuccessItems, getMembers, getNotifications, getOpportunities } from "@/lib/data"
import type { TenantId } from "@/lib/types"
import { OverviewClient } from "./overview-client"

export default async function OverviewPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params
  const typedTenantId = tenantId as TenantId

  const [members, opportunities, forcedSuccessItems, drafts, notifications] = await Promise.all([
    getMembers(typedTenantId),
    getOpportunities(typedTenantId),
    getForcedSuccessItems(typedTenantId),
    getDrafts(typedTenantId),
    getNotifications(typedTenantId),
  ])

  return (
    <OverviewClient
      tenantId={typedTenantId}
      members={members}
      opportunities={opportunities}
      forcedSuccessItems={forcedSuccessItems}
      drafts={drafts}
      notifications={notifications}
    />
  )
}
