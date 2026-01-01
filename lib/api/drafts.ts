import { mockDrafts, getDraftsByMember as getMockDraftsByMember } from "../mock-data"
import type { MessageDraft, DraftStatus } from "../types"

export async function getDrafts(status?: DraftStatus): Promise<MessageDraft[]> {
  await new Promise((resolve) => setTimeout(resolve, 100))
  if (status) {
    return mockDrafts.filter((d) => d.status === status)
  }
  return mockDrafts
}

export async function getDraftsByMember(memberId: string): Promise<MessageDraft[]> {
  await new Promise((resolve) => setTimeout(resolve, 50))
  return getMockDraftsByMember(memberId)
}

export async function getDraftById(id: string): Promise<MessageDraft | null> {
  await new Promise((resolve) => setTimeout(resolve, 50))
  return mockDrafts.find((d) => d.id === id) ?? null
}

export async function updateDraft(id: string, updates: Partial<MessageDraft>): Promise<MessageDraft | null> {
  await new Promise((resolve) => setTimeout(resolve, 100))
  const draft = mockDrafts.find((d) => d.id === id)
  if (!draft) return null
  return { ...draft, ...updates, editedAt: new Date().toISOString() }
}

export async function sendDraft(id: string, sentBy: string): Promise<MessageDraft | null> {
  return updateDraft(id, {
    status: "sent",
    sentAt: new Date().toISOString(),
    sentBy,
  })
}

export async function getPendingDrafts(): Promise<MessageDraft[]> {
  return getDrafts("pending")
}
