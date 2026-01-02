import { NextResponse } from "next/server"
import { z } from "zod"
import type { TenantId } from "@/lib/types"
import { markNotificationRead } from "@/lib/data"
import { requireTenantAccess } from "@/lib/auth/tenant-access"

const BodySchema = z.object({
  tenantId: z.string(),
  notificationId: z.string(),
})

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 })

  const tenantId = parsed.data.tenantId as TenantId

  try {
    await requireTenantAccess(tenantId)
    const notification = await markNotificationRead(parsed.data.notificationId)
    return NextResponse.json({ notification })
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

