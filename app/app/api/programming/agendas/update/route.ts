import { NextResponse } from "next/server"
import { z } from "zod"
import type { TenantId } from "@/lib/types"
import { updateMonthlyAgenda } from "@/lib/data/programming"
import { createAuditEntry } from "@/lib/data/audit"
import { requireTenantAccess } from "@/lib/auth/tenant-access"

const BodySchema = z.object({
  tenantId: z.string(),
  agendaId: z.string(),
  themes: z.array(z.string()).optional(),
  template: z.string().optional(),
})

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 })

  const tenantId = parsed.data.tenantId as TenantId
  try {
    const whoami = await requireTenantAccess(tenantId)
    const agenda = await updateMonthlyAgenda({
      id: parsed.data.agendaId,
      themes: parsed.data.themes,
      template: parsed.data.template,
    })
    if (!agenda) return NextResponse.json({ error: "Not found" }, { status: 404 })

    await createAuditEntry({
      tenantId,
      type: "monthly_agenda_updated",
      actor: whoami.user.name,
      actorRole: whoami.user.role,
      details: { agendaId: agenda.id },
    })

    return NextResponse.json({ agenda })
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    return NextResponse.json({ error: e instanceof Error ? e.message : "Server error" }, { status: 500 })
  }
}

