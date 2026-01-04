import { getIntroRecords, getIntroSuggestions, getMembers } from "@/lib/data"
import { CLUB_TENANT_ID } from "@/lib/club"
import { IntrosClient } from "./intros-client"

export default async function IntrosPage() {
  const [members, introSuggestions, introRecords] = await Promise.all([
    getMembers(CLUB_TENANT_ID),
    getIntroSuggestions(CLUB_TENANT_ID),
    getIntroRecords(CLUB_TENANT_ID),
  ])

  return (
    <IntrosClient
      members={members}
      introSuggestions={introSuggestions}
      introRecords={introRecords}
    />
  )
}
