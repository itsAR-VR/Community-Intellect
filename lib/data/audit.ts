import "server-only"

import { randomUUID } from "crypto"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { AuditEventType, AuditLogEntry, TenantId, UserRole } from "@/lib/types"
import { nullToUndefined } from "@/lib/data/_utils"

function auditRowToAudit(row: any): AuditLogEntry {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    type: row.type as AuditEventType,
    actor: (row.actor_label ?? row.actor_id ?? "Unknown") as string,
    actorRole: ((row.actor_role ?? "read_only") as UserRole) ?? "read_only",
    memberId: nullToUndefined(row.member_id),
    details: row.details ?? {},
    createdAt: row.created_at,
  }
}

export async function getAuditLogs(tenantId: TenantId): Promise<AuditLogEntry[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from("audit_logs")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
  if (error) throw error
  return (data ?? []).map(auditRowToAudit)
}

export async function createAuditEntry(input: Omit<AuditLogEntry, "id" | "createdAt">): Promise<AuditLogEntry> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from("audit_logs")
    .insert({
      id: randomUUID(),
      tenant_id: input.tenantId,
      type: input.type,
      actor_role: input.actorRole,
      actor_label: input.actor,
      member_id: input.memberId ?? null,
      details: input.details ?? {},
    })
    .select("*")
    .single()
  if (error) throw error
  return auditRowToAudit(data)
}
