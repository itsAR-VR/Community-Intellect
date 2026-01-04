import { getMastermindGroups, getMembers, getMonthlyAgendas, getWorkshopPlans } from "@/lib/data"
import { CLUB_TENANT_ID } from "@/lib/club"
import { ProgrammingClient } from "./programming-client"

export default async function ProgrammingPage() {
  const [members, masterminds, agendas, workshops] = await Promise.all([
    getMembers(CLUB_TENANT_ID),
    getMastermindGroups(CLUB_TENANT_ID),
    getMonthlyAgendas(CLUB_TENANT_ID),
    getWorkshopPlans(CLUB_TENANT_ID),
  ])

  return (
    <ProgrammingClient
      members={members}
      masterminds={masterminds}
      agendas={agendas}
      workshops={workshops}
    />
  )
}
