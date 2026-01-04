import { NextResponse } from "next/server"
import { z } from "zod"
import { randomUUID } from "crypto"
import type { MemberStatus } from "@/lib/types"
import { createMember } from "@/lib/data/members"
import { createAuditEntry } from "@/lib/data/audit"
import { requireClubAccess } from "@/lib/auth/tenant-access"
import { CLUB_TENANT_ID } from "@/lib/club"

const BodySchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  companyName: z.string().min(1),
  companyRole: z.string().min(1),
  status: z.enum(["lead", "accepted", "active", "churned", "paused"]).optional(),
})

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 })

  const requestedStatus = parsed.data.status as MemberStatus | undefined
  const status = requestedStatus === "active" ? ("accepted" as MemberStatus) : requestedStatus

  try {
    const whoami = await requireClubAccess()
    if (whoami.user.role === "read_only") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const member = await createMember({
      id: `mem_${randomUUID().slice(0, 8)}`,
      tenantId: CLUB_TENANT_ID,
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      email: parsed.data.email,
      companyName: parsed.data.companyName,
      companyRole: parsed.data.companyRole,
      status,
    })

    const warnings: string[] = []
    if (requestedStatus === "active") {
      warnings.push("Member cannot be created as Active until intake is complete; created as Accepted instead.")
    }

    await createAuditEntry({
      tenantId: CLUB_TENANT_ID,
      type: "member_created",
      actorId: whoami.user.id,
      actor: whoami.user.name,
      actorRole: whoami.user.role,
      memberId: member.id,
      details: { memberId: member.id },
    })

    return NextResponse.json({ member, warnings })
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    return NextResponse.json({ error: e instanceof Error ? e.message : "Server error" }, { status: 500 })
  }
}
