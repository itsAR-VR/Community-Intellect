import { NextResponse } from "next/server"
import { z } from "zod"
import { randomUUID } from "crypto"
import { createVelocityProof } from "@/lib/data/velocity"
import { createAuditEntry } from "@/lib/data/audit"
import { requireClubAccess } from "@/lib/auth/tenant-access"
import { CLUB_TENANT_ID } from "@/lib/club"

const BodySchema = z.object({
  challengeId: z.string(),
  memberId: z.string(),
  link: z.string().url(),
  description: z.string().min(1),
})

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  try {
    const whoami = await requireClubAccess()
    if (whoami.user.role === "read_only") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const proof = await createVelocityProof({
      id: `proof_${randomUUID().slice(0, 8)}`,
      tenantId: CLUB_TENANT_ID,
      challengeId: parsed.data.challengeId,
      memberId: parsed.data.memberId,
      link: parsed.data.link,
      description: parsed.data.description,
    })

    await createAuditEntry({
      tenantId: CLUB_TENANT_ID,
      type: "velocity_proof_created",
      actorId: whoami.user.id,
      actor: whoami.user.name,
      actorRole: whoami.user.role,
      memberId: proof.memberId,
      details: { proofId: proof.id, challengeId: proof.challengeId },
    })

    return NextResponse.json({ proof })
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    return NextResponse.json({ error: e instanceof Error ? e.message : "Server error" }, { status: 500 })
  }
}
