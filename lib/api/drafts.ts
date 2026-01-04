import "server-only"

import type { DraftStatus, MessageDraft } from "@/lib/types"
import {
  getDraftById as dbGetDraftById,
  getDrafts as dbGetDrafts,
  getDraftsByMember as dbGetDraftsByMember,
  updateDraft as dbUpdateDraft,
} from "@/lib/data"
import { requireClubAccess } from "@/lib/auth/tenant-access"
import { CLUB_TENANT_ID } from "@/lib/club"

export async function getDrafts(status?: DraftStatus): Promise<MessageDraft[]> {
  await requireClubAccess()
  return dbGetDrafts(CLUB_TENANT_ID, status)
}

export async function getDraftsByMember(memberId: string): Promise<MessageDraft[]> {
  return dbGetDraftsByMember(memberId)
}

export async function getDraftById(id: string): Promise<MessageDraft | null> {
  return dbGetDraftById(id)
}

export async function updateDraft(id: string, updates: Partial<MessageDraft>): Promise<MessageDraft | null> {
  const whoami = await requireClubAccess()
  return dbUpdateDraft(id, updates, whoami.user.id)
}

export async function sendDraft(id: string, sentBy: string): Promise<MessageDraft | null> {
  return dbUpdateDraft(
    id,
    {
      status: "sent",
      sentAt: new Date().toISOString(),
      sentBy,
    },
    sentBy,
  )
}

export async function getPendingDrafts(): Promise<MessageDraft[]> {
  return getDrafts("pending")
}
