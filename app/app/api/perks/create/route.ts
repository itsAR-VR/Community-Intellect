import { NextResponse } from "next/server"
import { z } from "zod"
import { randomUUID } from "crypto"
import type { TenantId } from "@/lib/types"
import { createPerk } from "@/lib/data/perks"
import { createAuditEntry } from "@/lib/data/audit"
import { requireTenantAccess } from "@/lib/auth/tenant-access"

const BodySchema = z.object({
  tenantId: z.string(),
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

  const tenantId = parsed.data.tenantId as TenantId
  try {
    const whoami = await requireTenantAccess(tenantId)
    const perk = await createPerk({
      id: randomUUID(),
      tenantId,
      name: parsed.data.name,
      partnerName: parsed.data.partnerName,
      category: parsed.data.category as any,
      description: parsed.data.description,
      value: parsed.data.value,
      active: true,
    } as any)

    await createAuditEntry({
      tenantId,
      type: "perk_created",
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

