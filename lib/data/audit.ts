import "server-only"

import { randomUUID } from "crypto"
import type { AuditEventType, AuditLogEntry, TenantId, UserRole } from "@/lib/types"
import { dateToIso, nullToUndefined } from "@/lib/data/_utils"
import { Prisma } from "@/lib/generated/prisma/client"
import { prisma } from "@/lib/prisma"

function auditRowToAudit(row: any): AuditLogEntry {
  return {
    id: row.id,
    tenantId: row.tenantId,
    type: row.type as AuditEventType,
    actor: (row.actorLabel ?? row.actorId ?? "Unknown") as string,
    actorRole: ((row.actorRole ?? "read_only") as UserRole) ?? "read_only",
    memberId: nullToUndefined(row.memberId),
    details: row.details ?? {},
    createdAt: dateToIso(row.createdAt),
  }
}

export async function getAuditLogs(tenantId: TenantId): Promise<AuditLogEntry[]> {
  const data = await prisma.auditLog.findMany({ where: { tenantId }, orderBy: { createdAt: "desc" } })
  return data.map(auditRowToAudit)
}

export async function createAuditEntry(
  input: Omit<AuditLogEntry, "id" | "createdAt"> & { actorId: string },
): Promise<AuditLogEntry> {
  const data = await prisma.auditLog.create({
    data: {
      id: randomUUID(),
      tenantId: input.tenantId,
      type: input.type,
      actorId: input.actorId,
      actorRole: input.actorRole,
      actorLabel: input.actor,
      memberId: input.memberId ?? null,
      details: (input.details ?? {}) as Prisma.InputJsonValue,
    },
  })
  return auditRowToAudit(data)
}
