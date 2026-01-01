import { mockSurveys } from "../mock-data"
import type { Survey, TenantId } from "../types"

export async function getSurveys(tenantId: TenantId): Promise<Survey[]> {
  await new Promise((resolve) => setTimeout(resolve, 100))
  // Filter by tenant through members
  return mockSurveys.filter((s) => s.tenantId === tenantId)
}

export async function getSurveyByMember(memberId: string): Promise<Survey | null> {
  await new Promise((resolve) => setTimeout(resolve, 50))
  return mockSurveys.find((s) => s.memberId === memberId) ?? null
}

export async function getLowSatisfactionSurveys(tenantId: TenantId, threshold = 5): Promise<Survey[]> {
  const surveys = await getSurveys(tenantId)
  return surveys.filter((s) => {
    const valueResponse = s.responses.find((r) => r.question.includes("valuable"))
    return valueResponse && Number.parseInt(valueResponse.answer) <= threshold
  })
}
