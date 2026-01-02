import { NextResponse } from "next/server"
import { z } from "zod"
import { randomUUID } from "crypto"
import type { TenantId } from "@/lib/types"
import { createIntroRecord } from "@/lib/data/intros"
import { createAuditEntry } from "@/lib/data/audit"
import { requireTenantAccess } from "@/lib/auth/tenant-access"

const BodySchema = z.object({
  tenantId: z.string(),
  memberAId: z.string(),
  memberBId: z.string(),
  rationale: z.string().min(1),
})

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 })

  const tenantId = parsed.data.tenantId as TenantId
  try {
    const whoami = await requireTenantAccess(tenantId)
    const record = await createIntroRecord({
      id: randomUUID(),
      tenantId,
      memberAId: parsed.data.memberAId,
      memberBId: parsed.data.memberBId,
      createdBy: whoami.user.id,
      status: "pending",
      messageToA: parsed.data.rationale,
      messageToB: parsed.data.rationale,
    })

    await createAuditEntry({
      tenantId,
      type: "intro_created",
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

