import { getDrafts, getForcedSuccessItems, getMembers, getNotifications, getOpportunities } from "@/lib/data"
import { CLUB_TENANT_ID } from "@/lib/club"
import { OverviewClient } from "./overview-client"

export default async function OverviewPage() {
  const [members, opportunities, forcedSuccessItems, drafts, notifications] = await Promise.all([
    getMembers(CLUB_TENANT_ID),
    getOpportunities(CLUB_TENANT_ID),
    getForcedSuccessItems(CLUB_TENANT_ID),
    getDrafts(CLUB_TENANT_ID),
    getNotifications(CLUB_TENANT_ID),
  ])

  return (
    <OverviewClient
      members={members}
      opportunities={opportunities}
      forcedSuccessItems={forcedSuccessItems}
      drafts={drafts}
      notifications={notifications}
    />
  )
}
