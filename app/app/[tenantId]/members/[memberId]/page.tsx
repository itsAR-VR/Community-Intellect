import { notFound } from "next/navigation"
import type { TenantId } from "@/lib/types"
import {
  getFactsByMember,
  getIntroRecordsByMember,
  getIntroSuggestionsByMember,
  getMemberById,
  getMembers,
  getOpportunitiesByMember,
  getDraftsByMember,
  getPerkRecommendations,
  getPerks,
  getSignalsByMember,
  getOutcomeFeedbackByMember,
} from "@/lib/data"
import { MemberProfileClient } from "./member-profile-client"

export default async function MemberProfilePage({ params }: { params: Promise<{ tenantId: string; memberId: string }> }) {
  const { tenantId, memberId } = await params
  const typedTenantId = tenantId as TenantId

  const member = await getMemberById(memberId)
  if (!member || member.tenantId !== typedTenantId) notFound()

  const [
    tenantMembers,
    facts,
    signals,
    opportunities,
    drafts,
    introSuggestions,
    introRecords,
    perkRecommendations,
    perks,
    outcomes,
  ] = await Promise.all([
    getMembers(typedTenantId),
    getFactsByMember(memberId),
    getSignalsByMember(memberId),
    getOpportunitiesByMember(memberId),
    getDraftsByMember(memberId),
    getIntroSuggestionsByMember(typedTenantId, memberId),
    getIntroRecordsByMember(typedTenantId, memberId),
    getPerkRecommendations(typedTenantId, memberId),
    getPerks(typedTenantId),
    getOutcomeFeedbackByMember(memberId),
  ])

  return (
    <MemberProfileClient
      tenantId={typedTenantId}
      tenantMembers={tenantMembers}
      member={member}
      facts={facts}
      signals={signals}
      opportunities={opportunities}
      drafts={drafts}
      introSuggestions={introSuggestions}
      introRecords={introRecords}
      perkRecommendations={perkRecommendations}
      perks={perks}
      outcomes={outcomes}
    />
  )
}
