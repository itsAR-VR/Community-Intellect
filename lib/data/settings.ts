import "server-only"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { TenantId, TenantSettings } from "@/lib/types"

export const DEFAULT_TENANT_SETTINGS: TenantSettings["settings"] = {
  integrations: {
    slack: { connected: false, lastSyncAt: null },
    recall: { connected: false, lastSyncAt: null },
    linkedin: { connected: false, lastSyncAt: null },
    careers: { connected: false, lastSyncAt: null },
    indeed: { connected: false, lastSyncAt: null },
    instagram: { connected: false, lastSyncAt: null },
    x: { connected: false, lastSyncAt: null },
  },
  cadence: {
    linkedinHours: 24,
    careersHours: 12,
  },
  autosend: {
    enabled: true,
    minImpactScore: 60,
    requireRecentActivity: true,
    respectContactState: true,
  },
  riskThresholds: {
    greenMax: 30,
    yellowMax: 60,
  },
} as const

function settingsRowToSettings(row: any): TenantSettings {
  return {
    tenantId: row.tenant_id,
    settings: row.settings ?? {},
    updatedAt: row.updated_at ?? undefined,
  }
}

export async function getTenantSettings(tenantId: TenantId): Promise<TenantSettings> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.from("tenant_settings").select("tenant_id,settings,updated_at").eq("tenant_id", tenantId).maybeSingle()
  if (error) throw error

  if (!data) {
    return { tenantId, settings: { ...DEFAULT_TENANT_SETTINGS } }
  }

  return {
    ...settingsRowToSettings(data),
    settings: { ...DEFAULT_TENANT_SETTINGS, ...(data.settings ?? {}) },
  }
}

export async function upsertTenantSettings(tenantId: TenantId, settings: Record<string, unknown>): Promise<TenantSettings> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from("tenant_settings")
    .upsert({ tenant_id: tenantId, settings })
    .select("tenant_id,settings,updated_at")
    .single()
  if (error) throw error
  return settingsRowToSettings(data)
}

