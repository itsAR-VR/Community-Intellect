import "server-only"

import type { PartnerApplicationStatus, Perk, PerkPartnerApplication, PerkRecommendation, TenantId } from "@/lib/types"
import { dateToIso, dateToIsoOrUndefined, nullToUndefined } from "@/lib/data/_utils"
import { prisma } from "@/lib/prisma"

function perkRowToPerk(row: any): Perk {
  return {
    id: row.id,
    tenantId: row.tenantId,
    name: row.name,
    description: row.description,
    category: row.category,
    partnerName: row.partnerName,
    partnerLogo: nullToUndefined(row.partnerLogo),
    value: nullToUndefined(row.value),
    url: nullToUndefined(row.url),
    expiresAt: dateToIsoOrUndefined(row.expiresAt),
    active: row.active,
    createdAt: dateToIso(row.createdAt),
  }
}

function perkRecRowToRec(row: any): PerkRecommendation {
  return {
    id: row.id,
    memberId: row.memberId,
    perkId: row.perkId,
    rationale: row.rationale,
    impactScore: row.impactScore,
    matchingFactIds: row.matchingFactIds ?? [],
    dismissed: row.dismissed,
    deliveredAt: dateToIsoOrUndefined(row.deliveredAt),
    createdAt: dateToIso(row.createdAt),
  }
}

function perkAppRowToApp(row: any): PerkPartnerApplication {
  return {
    id: row.id,
    tenantId: row.tenantId,
    companyName: row.companyName,
    contactName: row.contactName,
    contactEmail: row.contactEmail,
    perkDescription: row.perkDescription,
    status: row.status,
    reviewedBy: nullToUndefined(row.reviewedBy),
    reviewedAt: dateToIsoOrUndefined(row.reviewedAt),
    notes: nullToUndefined(row.notes),
    createdAt: dateToIso(row.createdAt),
  }
}

export async function getPerks(tenantId: TenantId): Promise<Perk[]> {
  const data = await prisma.perk.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
  })
  return data.map(perkRowToPerk)
}

export async function getPerkRecommendations(tenantId: TenantId, memberId?: string): Promise<PerkRecommendation[]> {
  const data = await prisma.perkRecommendation.findMany({
    where: { tenantId, ...(memberId ? { memberId } : {}) },
    orderBy: { createdAt: "desc" },
  })
  return data.map(perkRecRowToRec)
}

export async function getPerkPartnerApplications(tenantId: TenantId): Promise<PerkPartnerApplication[]> {
  const data = await prisma.perkPartnerApplication.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
  })
  return data.map(perkAppRowToApp)
}

export async function createPerk(input: Omit<Perk, "id" | "createdAt"> & { id: string; createdAt?: string }): Promise<Perk> {
  const data = await prisma.perk.create({
    data: {
      id: input.id,
      tenantId: input.tenantId,
      name: input.name,
      description: input.description,
      category: input.category,
      partnerName: input.partnerName,
      partnerLogo: input.partnerLogo ?? null,
      value: input.value ?? null,
      url: input.url ?? null,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      active: input.active,
      createdAt: input.createdAt ? new Date(input.createdAt) : new Date(),
    },
  })
  return perkRowToPerk(data)
}

export async function dismissPerkRecommendation(id: string): Promise<PerkRecommendation | null> {
  const data = await prisma.perkRecommendation.update({ where: { id }, data: { dismissed: true } }).catch(() => null)
  return data ? perkRecRowToRec(data) : null
}

export async function markPerkDelivered(id: string): Promise<PerkRecommendation | null> {
  const data = await prisma.perkRecommendation.update({ where: { id }, data: { deliveredAt: new Date() } }).catch(() => null)
  return data ? perkRecRowToRec(data) : null
}

export async function updatePartnerApplicationStatus(input: {
  id: string
  status: PartnerApplicationStatus
  reviewedBy: string
}): Promise<PerkPartnerApplication | null> {
  const data = await prisma.perkPartnerApplication
    .update({
      where: { id: input.id },
      data: {
        status: input.status,
        reviewedBy: input.reviewedBy,
        reviewedAt: new Date(),
      },
    })
    .catch(() => null)
  return data ? perkAppRowToApp(data) : null
}
