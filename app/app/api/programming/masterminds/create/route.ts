import { NextResponse } from "next/server"
import { z } from "zod"
import { randomUUID } from "crypto"
import type { TenantId } from "@/lib/types"
import { createMastermindGroup } from "@/lib/data/programming"
import { createAuditEntry } from "@/lib/data/audit"
import { requireTenantAccess } from "@/lib/auth/tenant-access"

const BodySchema = z.object({
  tenantId: z.string(),
  name: z.string().min(1),
  theme: z.string().optional(),
  leaderId: z.string().min(1),
  memberIds: z.array(z.string()).default([]),
  nextSessionAt: z.string().optional(),
})

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 })

  const tenantId = parsed.data.tenantId as TenantId
  try {
    const whoami = await requireTenantAccess(tenantId)
    const group = await createMastermindGroup({
      id: `mm_${randomUUID().slice(0, 8)}`,
      tenantId,
      name: parsed.data.name,
      theme: parsed.data.theme,
      leaderId: parsed.data.leaderId,
      memberIds: parsed.data.memberIds,
      nextSessionAt: parsed.data.nextSessionAt,
    })

    await createAuditEntry({
      tenantId,
      type: "mastermind_group_created",
      actor: whoami.user.name,
      actorRole: whoami.user.role,
      details: { groupId: group.id, name: group.name },
    })

    return NextResponse.json({ group })
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    return NextResponse.json({ error: e instanceof Error ? e.message : "Server error" }, { status: 500 })
  }
}

