import { getMembers, getVelocityChallenges, getVelocityProofs } from "@/lib/data"
import { CLUB_TENANT_ID } from "@/lib/club"
import { VelocityClient } from "./velocity-client"

export default async function VelocityPage() {
  const [members, challenges, proofs] = await Promise.all([
    getMembers(CLUB_TENANT_ID),
    getVelocityChallenges(CLUB_TENANT_ID),
    getVelocityProofs(CLUB_TENANT_ID),
  ])

  return <VelocityClient members={members} challenges={challenges} proofs={proofs} />
}
