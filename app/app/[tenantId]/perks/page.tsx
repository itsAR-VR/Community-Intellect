import type { TenantId } from "@/lib/types"
import { getMembers, getPerkPartnerApplications, getPerkRecommendations, getPerks } from "@/lib/data"
import { PerksClient } from "./perks-client"

export default async function PerksPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params
  const typedTenantId = tenantId as TenantId
  const [members, perks, recommendations, applications] = await Promise.all([
    getMembers(typedTenantId),
    getPerks(typedTenantId),
    getPerkRecommendations(typedTenantId),
    getPerkPartnerApplications(typedTenantId),
  ])

  return (
    <PerksClient
      tenantId={typedTenantId}
      members={members}
      perks={perks}
      recommendations={recommendations}
      applications={applications}
    />
  )
}
