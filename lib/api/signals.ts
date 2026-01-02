import "server-only"

import type { ExternalSignal, TenantId } from "../types"
import { getSignalsByMember as dbGetSignalsByMember, getSignalsForTenant as dbGetSignalsForTenant } from "@/lib/data"

export async function getSignalsByMember(memberId: string): Promise<ExternalSignal[]> {
  return dbGetSignalsByMember(memberId)
}

export async function getAllSignals(tenantId: TenantId): Promise<ExternalSignal[]> {
  return dbGetSignalsForTenant(tenantId)
}

export async function getRecentSignals(tenantId: TenantId, hours = 24): Promise<ExternalSignal[]> {
  const all = await dbGetSignalsForTenant(tenantId)
  const cutoff = new Date()
  cutoff.setHours(cutoff.getHours() - hours)
  return all.filter((s) => new Date(s.createdAt) > cutoff)
}

export async function getHighUrgencySignals(tenantId: TenantId, minUrgency = 8): Promise<ExternalSignal[]> {
  const all = await dbGetSignalsForTenant(tenantId)
  return all.filter((s) => s.urgency >= minUrgency)
}

