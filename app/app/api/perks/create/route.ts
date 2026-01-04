import { NextResponse } from "next/server"
import { z } from "zod"
import { randomUUID } from "crypto"
import { createPerk } from "@/lib/data/perks"
import { createAuditEntry } from "@/lib/data/audit"
import { requireClubAccess } from "@/lib/auth/tenant-access"
import { CLUB_TENANT_ID } from "@/lib/club"

const BodySchema = z.object({
  name: z.string().min(1),
  partnerName: z.string().min(1),
  category: z.string().min(1),
  value: z.string().optional(),
  description: z.string().min(1),
})

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  try {
    const whoami = await requireClubAccess()
    if (whoami.user.role === "read_only") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const perk = await createPerk({
      id: randomUUID(),
      tenantId: CLUB_TENANT_ID,
      name: parsed.data.name,
      partnerName: parsed.data.partnerName,
      category: parsed.data.category as any,
      description: parsed.data.description,
      value: parsed.data.value,
      active: true,
    } as any)

    await createAuditEntry({
      tenantId: CLUB_TENANT_ID,
      type: "perk_created",
      actorId: whoami.user.id,
      actor: whoami.user.name,
      actorRole: whoami.user.role,
      details: { perkId: perk.id },
    })

    return NextResponse.json({ perk })
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    return NextResponse.json({ error: e instanceof Error ? e.message : "Server error" }, { status: 500 })
  }
}
