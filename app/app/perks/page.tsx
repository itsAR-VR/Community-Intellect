import { getMembers, getPerkPartnerApplications, getPerkRecommendations, getPerks } from "@/lib/data"
import { CLUB_TENANT_ID } from "@/lib/club"
import { PerksClient } from "./perks-client"

export default async function PerksPage() {
  const [members, perks, recommendations, applications] = await Promise.all([
    getMembers(CLUB_TENANT_ID),
    getPerks(CLUB_TENANT_ID),
    getPerkRecommendations(CLUB_TENANT_ID),
    getPerkPartnerApplications(CLUB_TENANT_ID),
  ])

  return (
    <PerksClient
      members={members}
      perks={perks}
      recommendations={recommendations}
      applications={applications}
    />
  )
}
