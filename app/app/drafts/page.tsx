import { getDrafts, getMembers } from "@/lib/data"
import { CLUB_TENANT_ID } from "@/lib/club"
import { DraftsClient } from "./drafts-client"

export default async function DraftsPage() {
  const [members, drafts] = await Promise.all([getMembers(CLUB_TENANT_ID), getDrafts(CLUB_TENANT_ID, "pending")])
  return <DraftsClient members={members} drafts={drafts} />
}
