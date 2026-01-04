import { NextResponse } from "next/server"
import { z } from "zod"
import type { MemberStatus } from "@/lib/types"
import { updateMember } from "@/lib/data/members"
import { requireClubAccess } from "@/lib/auth/tenant-access"
import { CLUB_TENANT_ID } from "@/lib/club"
import { getMemberIntakeCompleteness } from "@/lib/intake/completeness"
import { createAuditEntry } from "@/lib/data/audit"

const BodySchema = z.object({
  memberId: z.string().min(1),
  status: z.enum(["lead", "accepted", "active", "paused", "churned"]),
})

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 })

  try {
    const whoami = await requireClubAccess()
    if (whoami.user.role === "read_only") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const status = parsed.data.status as MemberStatus
    if (status === "active") {
      const gate = await getMemberIntakeCompleteness({ tenantId: CLUB_TENANT_ID, memberId: parsed.data.memberId })
      if (!gate.ok) {
        return NextResponse.json(
          { error: "Intake incomplete: member cannot be marked Active yet", missing: gate.missing },
          { status: 409 },
        )
      }
    }

    const member = await updateMember(parsed.data.memberId, { status })
    if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 })

    await createAuditEntry({
      tenantId: CLUB_TENANT_ID,
      type: "member_status_changed",
      actorId: whoami.user.id,
      actor: whoami.user.name,
      actorRole: whoami.user.role,
      memberId: member.id,
      details: { memberId: member.id, status },
    })

    return NextResponse.json({ member })
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    return NextResponse.json({ error: e instanceof Error ? e.message : "Server error" }, { status: 500 })
  }
}

