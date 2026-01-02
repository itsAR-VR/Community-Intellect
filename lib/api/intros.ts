import "server-only"

import { randomUUID } from "crypto"
import type { IntroRecord, IntroStatus, IntroSuggestion } from "@/lib/types"
import {
  createIntroRecord,
  getIntroRecords as dbGetIntroRecords,
  getIntroRecordsByMember as dbGetIntroRecordsByMember,
  getIntroSuggestions as dbGetIntroSuggestions,
  getMemberById,
  updateIntroStatus as dbUpdateIntroStatus,
} from "@/lib/data"
import { requireWhoami } from "@/lib/auth/whoami"

export async function getIntroSuggestions(): Promise<IntroSuggestion[]> {
  const whoami = await requireWhoami()
  const results = await Promise.all(whoami.tenants.map((t) => dbGetIntroSuggestions(t.id)))
  return results.flat().filter((s) => !s.dismissed)
}

export async function getIntroRecords(status?: IntroStatus): Promise<IntroRecord[]> {
  const whoami = await requireWhoami()
  const results = await Promise.all(whoami.tenants.map((t) => dbGetIntroRecords(t.id)))
  const records = results.flat()
  return status ? records.filter((r) => r.status === status) : records
}

export async function getIntrosByMember(memberId: string): Promise<IntroRecord[]> {
  const whoami = await requireWhoami()
  const results = await Promise.all(whoami.tenants.map((t) => dbGetIntroRecordsByMember(t.id, memberId)))
  return results.flat()
}

export async function createIntro(intro: Omit<IntroRecord, "id" | "createdAt">): Promise<IntroRecord> {
  const memberA = await getMemberById(intro.memberAId)
  const memberB = await getMemberById(intro.memberBId)
  const tenantId = memberA?.tenantId ?? memberB?.tenantId
  if (!tenantId) throw new Error("Unable to infer tenant for intro")

  return createIntroRecord({
    id: randomUUID(),
    tenantId,
    memberAId: intro.memberAId,
    memberBId: intro.memberBId,
    createdBy: intro.createdBy,
    status: intro.status,
    suggestionId: intro.suggestionId,
    messageToA: intro.messageToA,
    messageToB: intro.messageToB,
  })
}

export async function updateIntroStatus(id: string, status: IntroStatus): Promise<IntroRecord | null> {
  return dbUpdateIntroStatus(id, status)
}
