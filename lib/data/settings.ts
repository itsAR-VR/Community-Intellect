import "server-only"

import type { TenantId, TenantSettings } from "@/lib/types"
import { dateToIso } from "@/lib/data/_utils"
import { prisma } from "@/lib/prisma"

export const DEFAULT_TENANT_SETTINGS: TenantSettings["settings"] = {
  automation: {
    surveys: {
      enabled: false,
      cadence: "weekly",
      maxPerRun: 50,
    },
    programmingReminders: {
      enabled: false,
    },
  },
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
    tenantId: row.tenantId,
    settings: row.settings ?? {},
    updatedAt: row.updatedAt ? dateToIso(row.updatedAt) : undefined,
  }
}

export async function getTenantSettings(tenantId: TenantId): Promise<TenantSettings> {
  const data = await prisma.tenantSettings.findUnique({ where: { tenantId } })
  if (!data) return { tenantId, settings: { ...DEFAULT_TENANT_SETTINGS } }
  const raw = (data.settings ?? {}) as Record<string, unknown>
  return { ...settingsRowToSettings(data), settings: { ...DEFAULT_TENANT_SETTINGS, ...raw } }
}

export async function upsertTenantSettings(tenantId: TenantId, settings: Record<string, unknown>): Promise<TenantSettings> {
  const data = await prisma.tenantSettings.upsert({
    where: { tenantId },
    create: { tenantId, settings: settings as any },
    update: { settings: settings as any },
  })
  return settingsRowToSettings(data)
}
