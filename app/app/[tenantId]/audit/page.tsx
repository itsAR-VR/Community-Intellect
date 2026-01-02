import type { TenantId } from "@/lib/types"
import { getAuditLogs, getMembers } from "@/lib/data"
import { AuditClient } from "./audit-client"

export default async function AuditPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params
  const typedTenantId = tenantId as TenantId
  const [members, logs] = await Promise.all([getMembers(typedTenantId), getAuditLogs(typedTenantId)])
  return <AuditClient tenantId={typedTenantId} members={members} logs={logs} />
}
