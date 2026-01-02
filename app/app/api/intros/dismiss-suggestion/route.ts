import { NextResponse } from "next/server"
import { z } from "zod"
import type { TenantId } from "@/lib/types"
import { dismissIntroSuggestion } from "@/lib/data/intros"
import { createAuditEntry } from "@/lib/data/audit"
import { requireTenantAccess } from "@/lib/auth/tenant-access"

const BodySchema = z.object({
  tenantId: z.string(),
  suggestionId: z.string(),
})

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 })

  const tenantId = parsed.data.tenantId as TenantId
  try {
    const whoami = await requireTenantAccess(tenantId)
    const suggestion = await dismissIntroSuggestion(parsed.data.suggestionId)
    if (!suggestion) return NextResponse.json({ error: "Not found" }, { status: 404 })

    await createAuditEntry({
      tenantId,
      type: "intro_suggestion_dismissed",
      actor: whoami.user.name,
      actorRole: whoami.user.role,
      memberId: suggestion.memberAId,
      details: { suggestionId: suggestion.id, memberAId: suggestion.memberAId, memberBId: suggestion.memberBId },
    })

    return NextResponse.json({ suggestion })
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    return NextResponse.json({ error: e instanceof Error ? e.message : "Server error" }, { status: 500 })
  }
}

