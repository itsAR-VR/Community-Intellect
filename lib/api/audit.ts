import "server-only"

import type { AuditEventType, AuditLogEntry, TenantId } from "@/lib/types"
import { createAuditEntry as dbCreateAuditEntry, getAuditLogs as dbGetAuditLogs } from "@/lib/data"

export async function getAuditLogs(
  tenantId: TenantId,
  filters?: {
    type?: AuditEventType
    actor?: string
    memberId?: string
    startDate?: string
    endDate?: string
  },
): Promise<AuditLogEntry[]> {
  let logs = await dbGetAuditLogs(tenantId)

  if (filters?.type) {
    logs = logs.filter((l) => l.type === filters.type)
  }
  if (filters?.actor) {
    logs = logs.filter((l) => l.actor === filters.actor)
  }
  if (filters?.memberId) {
    logs = logs.filter((l) => l.memberId === filters.memberId)
  }
  if (filters?.startDate) {
    logs = logs.filter((l) => new Date(l.createdAt) >= new Date(filters.startDate!))
  }
  if (filters?.endDate) {
    logs = logs.filter((l) => new Date(l.createdAt) <= new Date(filters.endDate!))
  }

  return logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export async function createAuditEntry(
  entry: Omit<AuditLogEntry, "id" | "createdAt"> & { actorId: string },
): Promise<AuditLogEntry> {
  return dbCreateAuditEntry(entry)
}
