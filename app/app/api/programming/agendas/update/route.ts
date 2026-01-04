import { NextResponse } from "next/server"
import { z } from "zod"
import { updateMonthlyAgenda } from "@/lib/data/programming"
import { createAuditEntry } from "@/lib/data/audit"
import { requireClubAccess } from "@/lib/auth/tenant-access"
import { CLUB_TENANT_ID } from "@/lib/club"

const BodySchema = z.object({
  agendaId: z.string(),
  themes: z.array(z.string()).optional(),
  template: z.string().optional(),
})

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  try {
    const whoami = await requireClubAccess()
    if (whoami.user.role === "read_only") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const agenda = await updateMonthlyAgenda({
      id: parsed.data.agendaId,
      themes: parsed.data.themes,
      template: parsed.data.template,
    })
    if (!agenda) return NextResponse.json({ error: "Not found" }, { status: 404 })

    await createAuditEntry({
      tenantId: CLUB_TENANT_ID,
      type: "monthly_agenda_updated",
      actorId: whoami.user.id,
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
