import { getMembers, getPods } from "@/lib/data"
import { CLUB_TENANT_ID } from "@/lib/club"
import { PodsClient } from "./pods-client"

export default async function PodsPage() {
  const [members, pods] = await Promise.all([getMembers(CLUB_TENANT_ID), getPods(CLUB_TENANT_ID)])
  return <PodsClient members={members} pods={pods} />
}
