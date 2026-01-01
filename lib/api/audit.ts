import { mockAuditLogs } from "../mock-data"
import type { AuditLogEntry, AuditEventType, TenantId } from "../types"

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
  await new Promise((resolve) => setTimeout(resolve, 100))
  let logs = mockAuditLogs.filter((l) => l.tenantId === tenantId)

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

export async function createAuditEntry(entry: Omit<AuditLogEntry, "id" | "createdAt">): Promise<AuditLogEntry> {
  await new Promise((resolve) => setTimeout(resolve, 50))
  return {
    ...entry,
    id: `audit_${Date.now()}`,
    createdAt: new Date().toISOString(),
  }
}
