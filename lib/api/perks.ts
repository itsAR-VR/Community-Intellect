import "server-only"

import type { PartnerApplicationStatus, Perk, PerkPartnerApplication, PerkRecommendation, TenantId } from "@/lib/types"
import {
  getMemberById,
  getPerkPartnerApplications,
  getPerkRecommendations as dbGetPerkRecommendations,
  getPerks as dbGetPerks,
  updatePartnerApplicationStatus as dbUpdatePartnerApplicationStatus,
} from "@/lib/data"
import { requireClubAccess } from "@/lib/auth/tenant-access"
import { CLUB_TENANT_ID } from "@/lib/club"

export async function getPerks(tenantId: TenantId): Promise<Perk[]> {
  const perks = await dbGetPerks(tenantId)
  return perks.filter((p) => p.active)
}

export async function getPerkRecommendations(memberId?: string): Promise<PerkRecommendation[]> {
  await requireClubAccess()
  if (memberId) {
    const member = await getMemberById(memberId)
    if (!member) return []
    const recs = await dbGetPerkRecommendations(member.tenantId, memberId)
    return recs.filter((r) => !r.dismissed)
  }

  const recs = await dbGetPerkRecommendations(CLUB_TENANT_ID)
  return recs.filter((r) => !r.dismissed)
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
