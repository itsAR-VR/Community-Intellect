import type { TenantId } from "@/lib/types"
import { getIntroRecords, getIntroSuggestions, getMembers } from "@/lib/data"
import { IntrosClient } from "./intros-client"

export default async function IntrosPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params
  const typedTenantId = tenantId as TenantId
  const [members, introSuggestions, introRecords] = await Promise.all([
    getMembers(typedTenantId),
    getIntroSuggestions(typedTenantId),
    getIntroRecords(typedTenantId),
  ])

  return (
    <IntrosClient
      tenantId={typedTenantId}
      members={members}
      introSuggestions={introSuggestions}
      introRecords={introRecords}
    />
  )
}
