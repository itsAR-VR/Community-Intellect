import { NextResponse } from "next/server"
import { z } from "zod"
import { updateDraft } from "@/lib/data/drafts"
import { createAuditEntry } from "@/lib/data/audit"
import { requireClubAccess } from "@/lib/auth/tenant-access"
import { CLUB_TENANT_ID } from "@/lib/club"

const BodySchema = z.object({
  draftId: z.string(),
  content: z.string().optional(),
  subject: z.string().optional(),
  autosendEligible: z.boolean().optional(),
  blockedReasons: z.array(z.string()).optional(),
  sendRecommendation: z.enum(["send", "review", "hold"]).optional(),
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
        content: parsed.data.content,
        subject: parsed.data.subject,
        autosendEligible: parsed.data.autosendEligible,
        blockedReasons: parsed.data.blockedReasons,
        sendRecommendation: parsed.data.sendRecommendation,
      },
      whoami.user.id,
    )
    if (!draft) return NextResponse.json({ error: "Not found" }, { status: 404 })

    await createAuditEntry({
      tenantId: CLUB_TENANT_ID,
      type: "draft_updated",
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
