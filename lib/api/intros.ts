import { mockIntroSuggestions, mockIntroRecords } from "../mock-data"
import type { IntroSuggestion, IntroRecord, IntroStatus } from "../types"

export async function getIntroSuggestions(): Promise<IntroSuggestion[]> {
  await new Promise((resolve) => setTimeout(resolve, 100))
  return mockIntroSuggestions.filter((s) => !s.dismissed)
}

export async function getIntroRecords(status?: IntroStatus): Promise<IntroRecord[]> {
  await new Promise((resolve) => setTimeout(resolve, 100))
  if (status) {
    return mockIntroRecords.filter((r) => r.status === status)
  }
  return mockIntroRecords
}

export async function getIntrosByMember(memberId: string): Promise<IntroRecord[]> {
  await new Promise((resolve) => setTimeout(resolve, 50))
  return mockIntroRecords.filter((r) => r.memberAId === memberId || r.memberBId === memberId)
}

export async function createIntro(intro: Omit<IntroRecord, "id" | "createdAt">): Promise<IntroRecord> {
  await new Promise((resolve) => setTimeout(resolve, 100))
  return {
    ...intro,
    id: `intro_${Date.now()}`,
    createdAt: new Date().toISOString(),
  }
}

export async function updateIntroStatus(id: string, status: IntroStatus): Promise<IntroRecord | null> {
  await new Promise((resolve) => setTimeout(resolve, 100))
  const intro = mockIntroRecords.find((r) => r.id === id)
  if (!intro) return null
  return {
    ...intro,
    status,
    completedAt: status === "completed" ? new Date().toISOString() : intro.completedAt,
  }
}
