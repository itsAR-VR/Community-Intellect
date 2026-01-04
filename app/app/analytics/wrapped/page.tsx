import { getMembers, getWrapped } from "@/lib/data"
import { CLUB_TENANT_ID } from "@/lib/club"
import { WrappedClient } from "./wrapped-client"

export default async function WrappedPage() {
  const [members, wrapped] = await Promise.all([getMembers(CLUB_TENANT_ID), getWrapped(CLUB_TENANT_ID)])
  return <WrappedClient members={members} wrapped={wrapped} />
}
