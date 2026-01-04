import "server-only"

import type { IntroRecord, IntroSuggestion, IntroStatus, TenantId } from "@/lib/types"
import { dateToIso, dateToIsoOrUndefined, nullToUndefined } from "@/lib/data/_utils"
import { prisma } from "@/lib/prisma"

function introSuggestionRowToSuggestion(row: any): IntroSuggestion {
  return {
    id: row.id,
    memberAId: row.memberAId,
    memberBId: row.memberBId,
    rationale: row.rationale,
    impactScore: row.impactScore,
    matchingFactIds: row.matchingFactIds ?? [],
    dismissed: row.dismissed,
    createdAt: dateToIso(row.createdAt),
  }
}

function introRecordRowToRecord(row: any): IntroRecord {
  return {
    id: row.id,
    memberAId: row.memberAId,
    memberBId: row.memberBId,
    status: row.status as IntroStatus,
    suggestionId: nullToUndefined(row.suggestionId),
    messageToA: nullToUndefined(row.messageToA),
    messageToB: nullToUndefined(row.messageToB),
    outcomeA: nullToUndefined(row.outcomeA),
    outcomeB: nullToUndefined(row.outcomeB),
    createdBy: row.createdBy,
    createdAt: dateToIso(row.createdAt),
    completedAt: dateToIsoOrUndefined(row.completedAt),
  }
}

export async function getIntroSuggestions(tenantId: TenantId): Promise<IntroSuggestion[]> {
  const data = await prisma.introSuggestion.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
  })
  return data.map(introSuggestionRowToSuggestion)
}

export async function getIntroRecords(tenantId: TenantId): Promise<IntroRecord[]> {
  const data = await prisma.introRecord.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
  })
  return data.map(introRecordRowToRecord)
}

export async function getIntroSuggestionsByMember(tenantId: TenantId, memberId: string): Promise<IntroSuggestion[]> {
  const data = await prisma.introSuggestion.findMany({
    where: { tenantId, OR: [{ memberAId: memberId }, { memberBId: memberId }] },
    orderBy: { createdAt: "desc" },
  })
  return data.map(introSuggestionRowToSuggestion)
}

export async function getIntroRecordsByMember(tenantId: TenantId, memberId: string): Promise<IntroRecord[]> {
  const data = await prisma.introRecord.findMany({
    where: { tenantId, OR: [{ memberAId: memberId }, { memberBId: memberId }] },
    orderBy: { createdAt: "desc" },
  })
  return data.map(introRecordRowToRecord)
}

export async function dismissIntroSuggestion(id: string): Promise<IntroSuggestion | null> {
  const data = await prisma.introSuggestion.update({ where: { id }, data: { dismissed: true } }).catch(() => null)
  return data ? introSuggestionRowToSuggestion(data) : null
}

export async function createIntroRecord(input: {
  id: string
  tenantId: TenantId
  memberAId: string
  memberBId: string
  createdBy: string
  status?: IntroStatus
  suggestionId?: string
  messageToA?: string
  messageToB?: string
}): Promise<IntroRecord> {
  const data = await prisma.introRecord.create({
    data: {
      id: input.id,
      tenantId: input.tenantId,
      memberAId: input.memberAId,
      memberBId: input.memberBId,
      status: input.status ?? "pending",
      suggestionId: input.suggestionId ?? null,
      messageToA: input.messageToA ?? null,
      messageToB: input.messageToB ?? null,
      createdBy: input.createdBy,
    },
  })
  return introRecordRowToRecord(data)
}

export async function updateIntroStatus(id: string, status: IntroStatus): Promise<IntroRecord | null> {
  const patch: Record<string, unknown> = { status }
  if (status === "completed") patch.completedAt = new Date()

  const data = await prisma.introRecord.update({ where: { id }, data: patch }).catch(() => null)
  return data ? introRecordRowToRecord(data) : null
}
