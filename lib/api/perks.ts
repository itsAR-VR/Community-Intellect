import { mockPerks, mockPerkRecommendations, mockPerkPartnerApplications } from "../mock-data"
import type { Perk, PerkRecommendation, PerkPartnerApplication, TenantId, PartnerApplicationStatus } from "../types"

export async function getPerks(tenantId: TenantId): Promise<Perk[]> {
  await new Promise((resolve) => setTimeout(resolve, 100))
  return mockPerks.filter((p) => p.tenantId === tenantId && p.active)
}

export async function getPerkRecommendations(memberId?: string): Promise<PerkRecommendation[]> {
  await new Promise((resolve) => setTimeout(resolve, 100))
  if (memberId) {
    return mockPerkRecommendations.filter((r) => r.memberId === memberId && !r.dismissed)
  }
  return mockPerkRecommendations.filter((r) => !r.dismissed)
}

export async function getPartnerApplications(
  tenantId: TenantId,
  status?: PartnerApplicationStatus,
): Promise<PerkPartnerApplication[]> {
  await new Promise((resolve) => setTimeout(resolve, 100))
  let apps = mockPerkPartnerApplications.filter((a) => a.tenantId === tenantId)
  if (status) {
    apps = apps.filter((a) => a.status === status)
  }
  return apps
}

export async function updatePartnerApplicationStatus(
  id: string,
  status: PartnerApplicationStatus,
  reviewedBy: string,
): Promise<PerkPartnerApplication | null> {
  await new Promise((resolve) => setTimeout(resolve, 100))
  const app = mockPerkPartnerApplications.find((a) => a.id === id)
  if (!app) return null
  return {
    ...app,
    status,
    reviewedBy,
    reviewedAt: new Date().toISOString(),
  }
}
