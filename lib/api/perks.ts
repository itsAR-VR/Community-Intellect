import "server-only"

import type { PartnerApplicationStatus, Perk, PerkPartnerApplication, PerkRecommendation, TenantId } from "@/lib/types"
import {
  getMemberById,
  getPerkPartnerApplications,
  getPerkRecommendations as dbGetPerkRecommendations,
  getPerks as dbGetPerks,
  updatePartnerApplicationStatus as dbUpdatePartnerApplicationStatus,
} from "@/lib/data"
import { requireWhoami } from "@/lib/auth/whoami"

export async function getPerks(tenantId: TenantId): Promise<Perk[]> {
  const perks = await dbGetPerks(tenantId)
  return perks.filter((p) => p.active)
}

export async function getPerkRecommendations(memberId?: string): Promise<PerkRecommendation[]> {
  if (memberId) {
    const member = await getMemberById(memberId)
    if (!member) return []
    const recs = await dbGetPerkRecommendations(member.tenantId, memberId)
    return recs.filter((r) => !r.dismissed)
  }

  const whoami = await requireWhoami()
  const results = await Promise.all(whoami.tenants.map((t) => dbGetPerkRecommendations(t.id)))
  return results.flat().filter((r) => !r.dismissed)
}

export async function getPartnerApplications(
  tenantId: TenantId,
  status?: PartnerApplicationStatus,
): Promise<PerkPartnerApplication[]> {
  const apps = await getPerkPartnerApplications(tenantId)
  return status ? apps.filter((a) => a.status === status) : apps
}

export async function updatePartnerApplicationStatus(
  id: string,
  status: PartnerApplicationStatus,
  reviewedBy: string,
): Promise<PerkPartnerApplication | null> {
  return dbUpdatePartnerApplicationStatus({ id, status, reviewedBy })
}
