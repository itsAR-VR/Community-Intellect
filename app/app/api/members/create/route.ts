import { NextResponse } from "next/server"
import { z } from "zod"
import { randomUUID } from "crypto"
import type { MemberStatus, TenantId } from "@/lib/types"
import { createMember } from "@/lib/data/members"
import { createAuditEntry } from "@/lib/data/audit"
import { requireTenantAccess } from "@/lib/auth/tenant-access"

const BodySchema = z.object({
  tenantId: z.string(),
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

  const tenantId = parsed.data.tenantId as TenantId
  const status = parsed.data.status as MemberStatus | undefined

  try {
    const whoami = await requireTenantAccess(tenantId)
    const member = await createMember({
      id: `mem_${randomUUID().slice(0, 8)}`,
      tenantId,
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      email: parsed.data.email,
      companyName: parsed.data.companyName,
      companyRole: parsed.data.companyRole,
      status,
    })

    await createAuditEntry({
      tenantId,
      type: "member_created",
      actor: whoami.user.name,
      actorRole: whoami.user.role,
      memberId: member.id,
      details: { memberId: member.id },
    })

    return NextResponse.json({ member })
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    return NextResponse.json({ error: e instanceof Error ? e.message : "Server error" }, { status: 500 })
  }
}
