import { NextResponse } from "next/server"
import { z } from "zod"
import { randomUUID } from "crypto"
import { createIntroRecord } from "@/lib/data/intros"
import { createAuditEntry } from "@/lib/data/audit"
import { requireClubAccess } from "@/lib/auth/tenant-access"
import { CLUB_TENANT_ID } from "@/lib/club"

const BodySchema = z.object({
  memberAId: z.string(),
  memberBId: z.string(),
  rationale: z.string().min(1),
})

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  try {
    const whoami = await requireClubAccess()
    if (whoami.user.role === "read_only") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const record = await createIntroRecord({
      id: randomUUID(),
      tenantId: CLUB_TENANT_ID,
      memberAId: parsed.data.memberAId,
      memberBId: parsed.data.memberBId,
      createdBy: whoami.user.id,
      status: "pending",
      messageToA: parsed.data.rationale,
      messageToB: parsed.data.rationale,
    })

    await createAuditEntry({
      tenantId: CLUB_TENANT_ID,
      type: "intro_created",
      actorId: whoami.user.id,
      actor: whoami.user.name,
      actorRole: whoami.user.role,
      memberId: parsed.data.memberAId,
      details: { introId: record.id, memberAId: parsed.data.memberAId, memberBId: parsed.data.memberBId },
    })

    return NextResponse.json({ record })
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    return NextResponse.json({ error: e instanceof Error ? e.message : "Server error" }, { status: 500 })
  }
}
