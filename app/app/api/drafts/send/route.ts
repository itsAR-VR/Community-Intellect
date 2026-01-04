import { NextResponse } from "next/server"
import { z } from "zod"
import { updateDraft } from "@/lib/data/drafts"
import { createAuditEntry } from "@/lib/data/audit"
import { enqueueOutboundMessageFromDraft } from "@/lib/data/outbound-messages"
import { requireClubAccess } from "@/lib/auth/tenant-access"
import { CLUB_TENANT_ID } from "@/lib/club"

const BodySchema = z.object({
  draftId: z.string(),
})

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 })

  try {
    const whoami = await requireClubAccess()
    if (whoami.user.role === "read_only") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const draft = await updateDraft(
      parsed.data.draftId,
      {
        status: "sent",
        sentAt: new Date().toISOString(),
        sentBy: whoami.user.id,
      },
      whoami.user.id,
    )
    if (!draft) return NextResponse.json({ error: "Not found" }, { status: 404 })

    // Phase 1: "Send" enqueues a delivery job (actual Slack delivery is integrated later).
    await enqueueOutboundMessageFromDraft({
      tenantId: CLUB_TENANT_ID,
      memberId: draft.memberId,
      draft,
      sendAs: "community_manager",
      channel: "slack_dm",
    }).catch(() => null)

    await createAuditEntry({
      tenantId: CLUB_TENANT_ID,
      type: "draft_sent",
      actorId: whoami.user.id,
      actor: whoami.user.name,
      actorRole: whoami.user.role,
      memberId: draft.memberId,
      details: { draftId: draft.id },
    })

    return NextResponse.json({ draft })
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    return NextResponse.json({ error: e instanceof Error ? e.message : "Server error" }, { status: 500 })
  }
}
