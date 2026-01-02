import { NextResponse } from "next/server"
import { z } from "zod"
import { randomUUID } from "crypto"
import type { TenantId } from "@/lib/types"
import { createResource } from "@/lib/data/resources"
import { createAuditEntry } from "@/lib/data/audit"
import { requireTenantAccess } from "@/lib/auth/tenant-access"

const BodySchema = z.object({
  tenantId: z.string(),
  title: z.string().min(1),
  description: z.string().min(1),
  type: z.string().min(1),
  tags: z.array(z.string()).default([]),
  url: z.string().optional(),
})

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 })

  const tenantId = parsed.data.tenantId as TenantId
  try {
    const whoami = await requireTenantAccess(tenantId)
    const resource = await createResource({
      id: randomUUID(),
      tenantId,
      title: parsed.data.title,
      description: parsed.data.description,
      type: parsed.data.type as any,
      tags: parsed.data.tags,
      url: parsed.data.url,
    })

    await createAuditEntry({
      tenantId,
      type: "resource_created",
      actor: whoami.user.name,
      actorRole: whoami.user.role,
      details: { resourceId: resource.id, title: resource.title },
    })

    return NextResponse.json({ resource })
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    return NextResponse.json({ error: e instanceof Error ? e.message : "Server error" }, { status: 500 })
  }
}

