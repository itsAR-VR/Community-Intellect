import "server-only"

import type { Survey, TenantId } from "@/lib/types"
import { dateToIsoOrUndefined, nullToUndefined } from "@/lib/data/_utils"
import { prisma } from "@/lib/prisma"

function surveyRowToSurvey(row: any): Survey {
  return {
    id: row.id,
    tenantId: row.tenantId,
    memberId: row.memberId,
    cadence: row.cadence,
    lastSentAt: dateToIsoOrUndefined(row.lastSentAt),
    lastCompletedAt: dateToIsoOrUndefined(row.lastCompletedAt),
    completionRate: row.completionRate,
    responses: (row.responses ?? []) as Survey["responses"],
  }
}

export async function getSurveys(tenantId: TenantId): Promise<Survey[]> {
  const data = await prisma.survey.findMany({
    where: { tenantId },
    orderBy: { memberId: "asc" },
  })
  return data.map(surveyRowToSurvey)
}

export async function getSurveyByMember(memberId: string): Promise<Survey | null> {
  const data = await prisma.survey.findFirst({ where: { memberId } })
  return data ? surveyRowToSurvey(data) : null
}

export async function getLowSatisfactionSurveys(tenantId: TenantId, threshold = 5): Promise<Survey[]> {
  const surveys = await getSurveys(tenantId)
  return surveys.filter((s) => {
    const valueResponse = s.responses.find((r) => r.question.toLowerCase().includes("valuable"))
    if (!valueResponse) return false
    const n = Number.parseInt(valueResponse.answer, 10)
    return Number.isFinite(n) && n <= threshold
  })
}

export async function sendSurvey(input: {
  id: string
  tenantId: TenantId
  memberId: string
  cadence: Survey["cadence"]
}): Promise<Survey> {
  const now = new Date()

  const existing = await prisma.survey.findFirst({
    where: { tenantId: input.tenantId, memberId: input.memberId },
  })

  if (existing) {
    const updated = await prisma.survey.update({
      where: { id: existing.id },
      data: { cadence: input.cadence, lastSentAt: now },
    })
    return surveyRowToSurvey(updated)
  }

  const created = await prisma.survey.create({
    data: {
      id: input.id,
      tenantId: input.tenantId,
      memberId: input.memberId,
      cadence: input.cadence,
      lastSentAt: now,
      lastCompletedAt: null,
      completionRate: 0,
      responses: [],
    },
  })
  return surveyRowToSurvey(created)
}
