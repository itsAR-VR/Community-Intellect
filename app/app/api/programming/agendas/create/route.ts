import { NextResponse } from "next/server"
import { z } from "zod"
import { randomUUID } from "crypto"
import { createMonthlyAgenda } from "@/lib/data/programming"
import { createAuditEntry } from "@/lib/data/audit"
import { requireClubAccess } from "@/lib/auth/tenant-access"
import { CLUB_TENANT_ID } from "@/lib/club"

const BodySchema = z.object({
  month: z.string().min(7),
  themes: z.array(z.string()).default([]),
  template: z.string().min(1),
})

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  try {
    const whoami = await requireClubAccess()
    if (whoami.user.role === "read_only") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const agenda = await createMonthlyAgenda({
      id: `ag_${randomUUID().slice(0, 8)}`,
      tenantId: CLUB_TENANT_ID,
      month: parsed.data.month,
      themes: parsed.data.themes,
      template: parsed.data.template,
    })

    await createAuditEntry({
      tenantId: CLUB_TENANT_ID,
      type: "monthly_agenda_created",
      actorId: whoami.user.id,
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
