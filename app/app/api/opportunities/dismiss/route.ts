import { NextResponse } from "next/server"
import { z } from "zod"
import { dismissOpportunity } from "@/lib/data/opportunities"
import { createAuditEntry } from "@/lib/data/audit"
import { requireClubAccess } from "@/lib/auth/tenant-access"
import { CLUB_TENANT_ID } from "@/lib/club"

const BodySchema = z.object({
  opportunityId: z.string(),
})

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 })

  try {
    const whoami = await requireClubAccess()
    if (whoami.user.role === "read_only") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const opportunity = await dismissOpportunity(parsed.data.opportunityId, whoami.user.id)
    if (!opportunity) return NextResponse.json({ error: "Not found" }, { status: 404 })

    await createAuditEntry({
      tenantId: CLUB_TENANT_ID,
      type: "opportunity_dismissed",
      actorId: whoami.user.id,
      actor: whoami.user.name,
      actorRole: whoami.user.role,
      memberId: opportunity.memberId,
      details: { opportunityId: opportunity.id },
    })

    return NextResponse.json({ opportunity })
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    return NextResponse.json({ error: e instanceof Error ? e.message : "Server error" }, { status: 500 })
  }
}
