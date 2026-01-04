import { NextResponse } from "next/server"
import { z } from "zod"
import { overrideForcedSuccessBlock } from "@/lib/data/forced-success"
import { createAuditEntry } from "@/lib/data/audit"
import { requireClubAccess } from "@/lib/auth/tenant-access"
import { CLUB_TENANT_ID } from "@/lib/club"

const BodySchema = z.object({
  forcedSuccessId: z.string(),
})

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  try {
    const whoami = await requireClubAccess()
    if (whoami.user.role === "read_only") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const item = await overrideForcedSuccessBlock({ id: parsed.data.forcedSuccessId, actorId: whoami.user.id })
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 })

    await createAuditEntry({
      tenantId: CLUB_TENANT_ID,
      type: "forced_success_block_overridden",
      actorId: whoami.user.id,
      actor: whoami.user.name,
      actorRole: whoami.user.role,
      memberId: item.memberId,
      details: { forcedSuccessId: item.id },
    })

    return NextResponse.json({ item })
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    return NextResponse.json({ error: e instanceof Error ? e.message : "Server error" }, { status: 500 })
  }
}
