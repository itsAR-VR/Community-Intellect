import "server-only"

import type { Member, TenantId } from "@/lib/types"
import { dateToIso, dateToIsoOrUndefined, nullToUndefined } from "@/lib/data/_utils"
import { prisma } from "@/lib/prisma"

function toTenantId(id: string): TenantId {
  return id as TenantId
}

function memberToMember(row: any): Member {
  return {
    id: row.id,
    tenantId: toTenantId(row.tenantId),
    firstName: row.firstName,
    lastName: row.lastName,
    email: row.email,
    avatarUrl: nullToUndefined(row.avatarUrl),
    linkedInUrl: nullToUndefined(row.linkedinUrl),
    company: {
      name: row.companyName,
      role: row.companyRole,
      website: nullToUndefined(row.companyWebsite),
      stage: nullToUndefined(row.companyStage),
      headcount: nullToUndefined(row.companyHeadcount),
      industry: nullToUndefined(row.companyIndustry),
    },
    status: row.status,
    joinedAt: dateToIso(row.joinedAt),
    renewalDate: dateToIsoOrUndefined(row.renewalDate),
    riskTier: row.riskTier,
    riskScore: row.riskScore,
    engagementScore: row.engagementScore,
    lastEngagementAt: dateToIsoOrUndefined(row.lastEngagementAt),
    contactState: row.contactState,
    lastContactedAt: dateToIsoOrUndefined(row.lastContactedAt),
    lastValueDropAt: dateToIsoOrUndefined(row.lastValueDropAt),
    onboarding: (row.onboarding ?? {}) as any,
    tags: row.tags ?? [],
    notes: nullToUndefined(row.notes),
    createdAt: dateToIso(row.createdAt),
    updatedAt: dateToIso(row.updatedAt),
  }
}

export async function getMembers(tenantId: TenantId): Promise<Member[]> {
  const data = await prisma.member.findMany({ where: { tenantId }, orderBy: { lastName: "asc" } })
  return data.map(memberToMember)
}

export async function getMemberById(memberId: string): Promise<Member | null> {
  const data = await prisma.member.findUnique({ where: { id: memberId } })
  return data ? memberToMember(data) : null
}

export async function updateMember(memberId: string, updates: Partial<Member>): Promise<Member | null> {
  // Only supports a minimal subset for now.
  const patch: Record<string, unknown> = {}
  if (updates.contactState) patch.contactState = updates.contactState
  if (updates.notes !== undefined) patch.notes = updates.notes ?? null
  if (updates.tags) patch.tags = updates.tags
  if (updates.status) patch.status = updates.status
  if (updates.riskTier) patch.riskTier = updates.riskTier
  if (updates.riskScore !== undefined) patch.riskScore = updates.riskScore
  if (updates.engagementScore !== undefined) patch.engagementScore = updates.engagementScore
  if (updates.lastContactedAt !== undefined) patch.lastContactedAt = updates.lastContactedAt ? new Date(updates.lastContactedAt) : null
  if (updates.lastValueDropAt !== undefined) patch.lastValueDropAt = updates.lastValueDropAt ? new Date(updates.lastValueDropAt) : null

  const data = await prisma.member.update({ where: { id: memberId }, data: patch }).catch(() => null)
  return data ? memberToMember(data) : null
}

export async function createMember(input: {
  id: string
  tenantId: TenantId
  firstName: string
  lastName: string
  email: string
  companyName: string
  companyRole: string
  status?: Member["status"]
}): Promise<Member> {
  const now = new Date()
  const data = await prisma.member.create({
    data: {
      id: input.id,
      tenantId: input.tenantId,
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      avatarUrl: null,
      linkedinUrl: null,
      companyName: input.companyName,
      companyRole: input.companyRole,
      companyWebsite: null,
      companyStage: null,
      companyHeadcount: null,
      companyIndustry: null,
      status: input.status ?? "lead",
      joinedAt: now,
      renewalDate: null,
      riskTier: "green",
      riskScore: 0,
      engagementScore: 50,
      lastEngagementAt: null,
      contactState: "open",
      lastContactedAt: null,
      lastValueDropAt: null,
      onboarding: {
        intakeCompleted: false,
        welcomeCallCompleted: false,
        introPackDelivered: false,
        profileVerified: false,
      } as any,
      tags: [],
      notes: null,
      createdAt: now,
      updatedAt: now,
    },
  })
  return memberToMember(data)
}
