import { NextResponse } from "next/server"
import { z } from "zod"
import type { TenantId } from "@/lib/types"
import { updateDraft } from "@/lib/data/drafts"
import { createAuditEntry } from "@/lib/data/audit"
import { requireTenantAccess } from "@/lib/auth/tenant-access"

const BodySchema = z.object({
  tenantId: z.string(),
  draftId: z.string(),
})

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 })

  const tenantId = parsed.data.tenantId as TenantId

  try {
    const whoami = await requireTenantAccess(tenantId)
    const draft = await updateDraft(parsed.data.draftId, { status: "discarded" }, whoami.user.id)
    if (!draft) return NextResponse.json({ error: "Not found" }, { status: 404 })

    await createAuditEntry({
      tenantId,
      type: "draft_discarded",
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

