import { NextResponse } from "next/server"
import { z } from "zod"
import type { TenantId } from "@/lib/types"
import { dismissOpportunity } from "@/lib/data/opportunities"
import { createAuditEntry } from "@/lib/data/audit"
import { requireTenantAccess } from "@/lib/auth/tenant-access"

const BodySchema = z.object({
  tenantId: z.string(),
  opportunityId: z.string(),
})

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 })

  const tenantId = parsed.data.tenantId as TenantId

  try {
    const whoami = await requireTenantAccess(tenantId)
    const opportunity = await dismissOpportunity(parsed.data.opportunityId, whoami.user.id)
    if (!opportunity) return NextResponse.json({ error: "Not found" }, { status: 404 })

    await createAuditEntry({
      tenantId,
      type: "opportunity_dismissed",
      actor: whoami.user.name,
      actorRole: whoami.user.role,
      memberId: opportunity.memberId,
      details: { opportunityId: opportunity.id },
    })

    return NextResponse.json({ opportunity })
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    return NextResponse.json({ error: e instanceof Error ? e.message : "Server error" }, { status: 500 })
  }
}

