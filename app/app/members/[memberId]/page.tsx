import { notFound } from "next/navigation"
import { CLUB_TENANT_ID } from "@/lib/club"
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
  getSlackIdentityForMember,
  getSlackDmThreadForMember,
} from "@/lib/data"
import { MemberProfileClient } from "./member-profile-client"

export default async function MemberProfilePage({ params }: { params: Promise<{ memberId: string }> }) {
  const { memberId } = await params

  const member = await getMemberById(memberId)
  if (!member || member.tenantId !== CLUB_TENANT_ID) notFound()

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
    slackIdentity,
    slackDmThread,
  ] = await Promise.all([
    getMembers(CLUB_TENANT_ID),
    getFactsByMember(memberId),
    getSignalsByMember(memberId),
    getOpportunitiesByMember(memberId),
    getDraftsByMember(memberId),
    getIntroSuggestionsByMember(CLUB_TENANT_ID, memberId),
    getIntroRecordsByMember(CLUB_TENANT_ID, memberId),
    getPerkRecommendations(CLUB_TENANT_ID, memberId),
    getPerks(CLUB_TENANT_ID),
    getOutcomeFeedbackByMember(memberId),
    getSlackIdentityForMember(CLUB_TENANT_ID, memberId),
    getSlackDmThreadForMember(CLUB_TENANT_ID, memberId),
  ])

  return (
    <MemberProfileClient
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
      slackIdentity={slackIdentity}
      slackDmThread={slackDmThread}
    />
  )
}
