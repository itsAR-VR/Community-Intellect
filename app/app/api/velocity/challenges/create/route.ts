import { NextResponse } from "next/server"
import { z } from "zod"
import { randomUUID } from "crypto"
import type { TenantId } from "@/lib/types"
import { createVelocityChallenge } from "@/lib/data/velocity"
import { createAuditEntry } from "@/lib/data/audit"
import { requireTenantAccess } from "@/lib/auth/tenant-access"

const BodySchema = z.object({
  tenantId: z.string(),
  title: z.string().min(1),
  theme: z.string().min(1),
  participantIds: z.array(z.string()).default([]),
  startDate: z.string().min(10),
  endDate: z.string().min(10),
  active: z.boolean().default(true),
})

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 })

  const tenantId = parsed.data.tenantId as TenantId
  try {
    const whoami = await requireTenantAccess(tenantId)
    const challenge = await createVelocityChallenge({
      id: `ch_${randomUUID().slice(0, 8)}`,
      tenantId,
      title: parsed.data.title,
      theme: parsed.data.theme,
      participantIds: parsed.data.participantIds,
      startDate: parsed.data.startDate,
      endDate: parsed.data.endDate,
      active: parsed.data.active,
    })

    await createAuditEntry({
      tenantId,
      type: "velocity_challenge_created",
      actor: whoami.user.name,
      actorRole: whoami.user.role,
      details: { challengeId: challenge.id },
    })

    return NextResponse.json({ challenge })
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    return NextResponse.json({ error: e instanceof Error ? e.message : "Server error" }, { status: 500 })
  }
}

