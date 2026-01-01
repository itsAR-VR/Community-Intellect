import { mockFacts, getFactsByMember as getMockFactsByMember } from "../mock-data"
import type { Fact } from "../types"

export async function getFactsByMember(memberId: string): Promise<Fact[]> {
  await new Promise((resolve) => setTimeout(resolve, 50))
  return getMockFactsByMember(memberId)
}

export async function getAllFacts(): Promise<Fact[]> {
  await new Promise((resolve) => setTimeout(resolve, 100))
  return mockFacts
}

export async function updateFact(id: string, updates: Partial<Fact>): Promise<Fact | null> {
  await new Promise((resolve) => setTimeout(resolve, 100))
  const fact = mockFacts.find((f) => f.id === id)
  if (!fact) return null
  return { ...fact, ...updates, updatedAt: new Date().toISOString() }
}

export async function verifyFact(id: string, verifiedBy: string): Promise<Fact | null> {
  return updateFact(id, {
    verifiedAt: new Date().toISOString(),
    verifiedBy,
  })
}
