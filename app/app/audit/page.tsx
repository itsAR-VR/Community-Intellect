import { getAuditLogs, getMembers } from "@/lib/data"
import { CLUB_TENANT_ID } from "@/lib/club"
import { AuditClient } from "./audit-client"

export default async function AuditPage() {
  const [members, logs] = await Promise.all([getMembers(CLUB_TENANT_ID), getAuditLogs(CLUB_TENANT_ID)])
  return <AuditClient members={members} logs={logs} />
}
