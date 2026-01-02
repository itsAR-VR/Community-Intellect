import type { TenantId } from "@/lib/types"
import { getMastermindGroups, getMembers, getMonthlyAgendas, getWorkshopPlans } from "@/lib/data"
import { ProgrammingClient } from "./programming-client"

export default async function ProgrammingPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params
  const typedTenantId = tenantId as TenantId
  const [members, masterminds, agendas, workshops] = await Promise.all([
    getMembers(typedTenantId),
    getMastermindGroups(typedTenantId),
    getMonthlyAgendas(typedTenantId),
    getWorkshopPlans(typedTenantId),
  ])

  return (
    <ProgrammingClient
      tenantId={typedTenantId}
      members={members}
      masterminds={masterminds}
      agendas={agendas}
      workshops={workshops}
    />
  )
}
