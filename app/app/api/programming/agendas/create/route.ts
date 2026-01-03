import { NextResponse } from "next/server"
import { z } from "zod"
import { randomUUID } from "crypto"
import type { TenantId } from "@/lib/types"
import { createMonthlyAgenda } from "@/lib/data/programming"
import { createAuditEntry } from "@/lib/data/audit"
import { requireTenantAccess } from "@/lib/auth/tenant-access"

const BodySchema = z.object({
  tenantId: z.string(),
  month: z.string().min(7),
  themes: z.array(z.string()).default([]),
  template: z.string().min(1),
})

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 })

  const tenantId = parsed.data.tenantId as TenantId
  try {
    const whoami = await requireTenantAccess(tenantId)
    const agenda = await createMonthlyAgenda({
      id: `ag_${randomUUID().slice(0, 8)}`,
      tenantId,
      month: parsed.data.month,
      themes: parsed.data.themes,
      template: parsed.data.template,
    })

    await createAuditEntry({
      tenantId,
      type: "monthly_agenda_created",
      actor: whoami.user.name,
      actorRole: whoami.user.role,
      details: { agendaId: agenda.id, month: agenda.month },
    })

    return NextResponse.json({ agenda })
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    return NextResponse.json({ error: e instanceof Error ? e.message : "Server error" }, { status: 500 })
  }
}

