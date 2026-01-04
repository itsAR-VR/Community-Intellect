import { getMembers, getOpportunities } from "@/lib/data"
import { CLUB_TENANT_ID } from "@/lib/club"
import { OpportunitiesClient } from "./opportunities-client"

export default async function OpportunitiesPage() {
  const [members, opportunities] = await Promise.all([getMembers(CLUB_TENANT_ID), getOpportunities(CLUB_TENANT_ID)])
  return <OpportunitiesClient members={members} opportunities={opportunities} />
}
