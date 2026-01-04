import { NextResponse } from "next/server"
import { z } from "zod"
import { randomUUID } from "crypto"
import { createVelocityChallenge } from "@/lib/data/velocity"
import { createAuditEntry } from "@/lib/data/audit"
import { requireClubAccess } from "@/lib/auth/tenant-access"
import { CLUB_TENANT_ID } from "@/lib/club"

const BodySchema = z.object({
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
  try {
    const whoami = await requireClubAccess()
    if (whoami.user.role === "read_only") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const challenge = await createVelocityChallenge({
      id: `ch_${randomUUID().slice(0, 8)}`,
      tenantId: CLUB_TENANT_ID,
      title: parsed.data.title,
      theme: parsed.data.theme,
      participantIds: parsed.data.participantIds,
      startDate: parsed.data.startDate,
      endDate: parsed.data.endDate,
      active: parsed.data.active,
    })

    await createAuditEntry({
      tenantId: CLUB_TENANT_ID,
      type: "velocity_challenge_created",
      actorId: whoami.user.id,
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
