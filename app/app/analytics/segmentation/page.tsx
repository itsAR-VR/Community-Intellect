import { getMembers, getPersonaClusters } from "@/lib/data"
import { CLUB_TENANT_ID } from "@/lib/club"
import { SegmentationClient } from "./segmentation-client"

export default async function SegmentationPage() {
  const [members, clusters] = await Promise.all([getMembers(CLUB_TENANT_ID), getPersonaClusters(CLUB_TENANT_ID)])
  return <SegmentationClient members={members} clusters={clusters} />
}
