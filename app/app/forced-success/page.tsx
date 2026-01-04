import { getForcedSuccessItems, getMembers } from "@/lib/data"
import { CLUB_TENANT_ID } from "@/lib/club"
import { ForcedSuccessClient } from "./forced-success-client"

export default async function ForcedSuccessPage() {
  const [members, items] = await Promise.all([getMembers(CLUB_TENANT_ID), getForcedSuccessItems(CLUB_TENANT_ID)])
  return <ForcedSuccessClient members={members} items={items} />
}
