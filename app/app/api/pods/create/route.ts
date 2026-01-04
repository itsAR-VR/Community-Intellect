import { NextResponse } from "next/server"
import { z } from "zod"
import { randomUUID } from "crypto"
import { createPod } from "@/lib/data/pods"
import { createAuditEntry } from "@/lib/data/audit"
import { requireClubAccess } from "@/lib/auth/tenant-access"
import { CLUB_TENANT_ID } from "@/lib/club"

const BodySchema = z.object({
  name: z.string().min(1),
  memberIds: z.array(z.string()).default([]),
})

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  try {
    const whoami = await requireClubAccess()
    if (whoami.user.role === "read_only") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const pod = await createPod({
      id: `pod_${randomUUID().slice(0, 8)}`,
      tenantId: CLUB_TENANT_ID,
      name: parsed.data.name,
      memberIds: parsed.data.memberIds,
    })

    await createAuditEntry({
      tenantId: CLUB_TENANT_ID,
      type: "pod_created",
      actorId: whoami.user.id,
      actor: whoami.user.name,
      actorRole: whoami.user.role,
      details: { podId: pod.id, name: pod.name },
    })

    return NextResponse.json({ pod })
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    return NextResponse.json({ error: e instanceof Error ? e.message : "Server error" }, { status: 500 })
  }
}
