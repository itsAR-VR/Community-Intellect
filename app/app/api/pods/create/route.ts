import { NextResponse } from "next/server"
import { z } from "zod"
import { randomUUID } from "crypto"
import type { TenantId } from "@/lib/types"
import { createPod } from "@/lib/data/pods"
import { createAuditEntry } from "@/lib/data/audit"
import { requireTenantAccess } from "@/lib/auth/tenant-access"

const BodySchema = z.object({
  tenantId: z.string(),
  name: z.string().min(1),
  memberIds: z.array(z.string()).default([]),
})

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 })

  const tenantId = parsed.data.tenantId as TenantId
  try {
    const whoami = await requireTenantAccess(tenantId)
    const pod = await createPod({
      id: `pod_${randomUUID().slice(0, 8)}`,
      tenantId,
      name: parsed.data.name,
      memberIds: parsed.data.memberIds,
    })

    await createAuditEntry({
      tenantId,
      type: "pod_created",
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

