import { getMembers, getSurveys } from "@/lib/data"
import { CLUB_TENANT_ID } from "@/lib/club"
import { SurveysClient } from "./surveys-client"

export default async function SurveysPage() {
  const [members, surveys] = await Promise.all([getMembers(CLUB_TENANT_ID), getSurveys(CLUB_TENANT_ID)])
  return <SurveysClient members={members} surveys={surveys} />
}
