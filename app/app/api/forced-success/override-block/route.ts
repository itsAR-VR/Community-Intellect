import { NextResponse } from "next/server"
import { z } from "zod"
import type { TenantId } from "@/lib/types"
import { overrideForcedSuccessBlock } from "@/lib/data/forced-success"
import { createAuditEntry } from "@/lib/data/audit"
import { requireTenantAccess } from "@/lib/auth/tenant-access"

const BodySchema = z.object({
  tenantId: z.string(),
  forcedSuccessId: z.string(),
})

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 })

  const tenantId = parsed.data.tenantId as TenantId
  try {
    const whoami = await requireTenantAccess(tenantId)
    const item = await overrideForcedSuccessBlock({ id: parsed.data.forcedSuccessId, actorId: whoami.user.id })
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 })

    await createAuditEntry({
      tenantId,
      type: "forced_success_block_overridden",
      actor: whoami.user.name,
      actorRole: whoami.user.role,
      memberId: item.memberId,
      details: { forcedSuccessId: item.id },
    })

    return NextResponse.json({ item })
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    return NextResponse.json({ error: e instanceof Error ? e.message : "Server error" }, { status: 500 })
  }
}

