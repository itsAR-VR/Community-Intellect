import { NextResponse } from "next/server"
import { z } from "zod"
import { randomUUID } from "crypto"
import type { TenantId } from "@/lib/types"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { createForcedSuccessItem } from "@/lib/data/forced-success"
import { createAuditEntry } from "@/lib/data/audit"
import { requireTenantAccess } from "@/lib/auth/tenant-access"
import { format, startOfWeek } from "date-fns"

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
    const supabase = await createSupabaseServerClient()
    const { data: oppRow, error } = await supabase
      .from("opportunities")
      .select("id,tenant_id,member_id,recommended_actions")
      .eq("id", parsed.data.opportunityId)
      .eq("tenant_id", tenantId)
      .maybeSingle()
    if (error) throw error
    if (!oppRow) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const weekOf = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-'W'ww")
    const actions = (oppRow.recommended_actions ?? []) as any[]
    const top = actions.slice().sort((a, b) => (b.impactScore ?? 0) - (a.impactScore ?? 0))[0]
    const recommendedActionType = (top?.type ?? "check_in") as any

    const item = await createForcedSuccessItem({
      id: randomUUID(),
      tenantId,
      memberId: oppRow.member_id,
      weekOf,
      recommendedActionType,
      recommendedActions: actions as any,
    })

    await createAuditEntry({
      tenantId,
      type: "forced_success_added",
      actor: whoami.user.name,
      actorRole: whoami.user.role,
      memberId: oppRow.member_id,
      details: { forcedSuccessId: item.id, opportunityId: oppRow.id, weekOf },
    })

    return NextResponse.json({ item })
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    return NextResponse.json({ error: e instanceof Error ? e.message : "Server error" }, { status: 500 })
  }
}
