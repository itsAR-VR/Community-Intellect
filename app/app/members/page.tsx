import { getMembers } from "@/lib/data"
import { CLUB_TENANT_ID } from "@/lib/club"
import { MembersClient } from "./members-client"

export default async function MembersPage() {
  const members = await getMembers(CLUB_TENANT_ID)
  return <MembersClient members={members} />
}
