import type { TenantId } from "@/lib/types"
import { getMembers, getSurveys } from "@/lib/data"
import { SurveysClient } from "./surveys-client"

export default async function SurveysPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params
  const typedTenantId = tenantId as TenantId
  const [members, surveys] = await Promise.all([getMembers(typedTenantId), getSurveys(typedTenantId)])
  return <SurveysClient tenantId={typedTenantId} members={members} surveys={surveys} />
}
