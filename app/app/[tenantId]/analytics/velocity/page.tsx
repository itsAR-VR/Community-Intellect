import type { TenantId } from "@/lib/types"
import { getMembers, getVelocityChallenges, getVelocityProofs } from "@/lib/data"
import { VelocityClient } from "./velocity-client"

export default async function VelocityPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params
  const typedTenantId = tenantId as TenantId
  const [members, challenges, proofs] = await Promise.all([
    getMembers(typedTenantId),
    getVelocityChallenges(typedTenantId),
    getVelocityProofs(typedTenantId),
  ])

  return <VelocityClient tenantId={typedTenantId} members={members} challenges={challenges} proofs={proofs} />
}
