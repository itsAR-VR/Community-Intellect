import { NextResponse } from "next/server"
import { z } from "zod"
import { randomUUID } from "crypto"
import { createForcedSuccessItem } from "@/lib/data/forced-success"
import { createAuditEntry } from "@/lib/data/audit"
import { requireClubAccess } from "@/lib/auth/tenant-access"
import { format, startOfWeek } from "date-fns"
import { CLUB_TENANT_ID } from "@/lib/club"
import { prisma } from "@/lib/prisma"

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

    const oppRow = await prisma.opportunity.findFirst({
      where: { id: parsed.data.opportunityId, tenantId: CLUB_TENANT_ID },
      select: { id: true, memberId: true, recommendedActions: true },
    })
    if (!oppRow) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const weekOf = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-'W'ww")
    const actions = (oppRow.recommendedActions ?? []) as any[]
    const top = actions.slice().sort((a, b) => (b.impactScore ?? 0) - (a.impactScore ?? 0))[0]
    const recommendedActionType = (top?.type ?? "check_in") as any

    const item = await createForcedSuccessItem({
      id: randomUUID(),
      tenantId: CLUB_TENANT_ID,
      memberId: oppRow.memberId,
      weekOf,
      recommendedActionType,
      recommendedActions: actions as any,
    })

    await createAuditEntry({
      tenantId: CLUB_TENANT_ID,
      type: "forced_success_added",
      actorId: whoami.user.id,
      actor: whoami.user.name,
      actorRole: whoami.user.role,
      memberId: oppRow.memberId,
      details: { forcedSuccessId: item.id, opportunityId: oppRow.id, weekOf },
    })

    return NextResponse.json({ item })
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    return NextResponse.json({ error: e instanceof Error ? e.message : "Server error" }, { status: 500 })
  }
}
