import { mockSignals, getSignalsByMember as getMockSignalsByMember } from "../mock-data"
import type { ExternalSignal } from "../types"

export async function getSignalsByMember(memberId: string): Promise<ExternalSignal[]> {
  await new Promise((resolve) => setTimeout(resolve, 50))
  return getMockSignalsByMember(memberId)
}

export async function getAllSignals(): Promise<ExternalSignal[]> {
  await new Promise((resolve) => setTimeout(resolve, 100))
  return mockSignals
}

export async function getRecentSignals(hours = 24): Promise<ExternalSignal[]> {
  await new Promise((resolve) => setTimeout(resolve, 100))
  const cutoff = new Date()
  cutoff.setHours(cutoff.getHours() - hours)
  return mockSignals.filter((s) => new Date(s.createdAt) > cutoff)
}

export async function getHighUrgencySignals(minUrgency = 8): Promise<ExternalSignal[]> {
  await new Promise((resolve) => setTimeout(resolve, 100))
  return mockSignals.filter((s) => s.urgency >= minUrgency)
}
