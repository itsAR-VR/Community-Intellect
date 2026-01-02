import "server-only"

import type { Survey, TenantId } from "@/lib/types"
import {
  getLowSatisfactionSurveys as dbGetLowSatisfactionSurveys,
  getSurveyByMember as dbGetSurveyByMember,
  getSurveys as dbGetSurveys,
} from "@/lib/data"

export async function getSurveys(tenantId: TenantId): Promise<Survey[]> {
  return dbGetSurveys(tenantId)
}

export async function getSurveyByMember(memberId: string): Promise<Survey | null> {
  return dbGetSurveyByMember(memberId)
}

export async function getLowSatisfactionSurveys(tenantId: TenantId, threshold = 5): Promise<Survey[]> {
  return dbGetLowSatisfactionSurveys(tenantId, threshold)
}
