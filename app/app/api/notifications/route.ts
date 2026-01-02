import { NextResponse } from "next/server"
import { z } from "zod"
import type { TenantId } from "@/lib/types"
import { getNotifications } from "@/lib/data"
import { requireTenantAccess } from "@/lib/auth/tenant-access"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const parsed = z
    .object({
      tenantId: z.string(),
      unreadOnly: z.string().optional(),
    })
    .safeParse(Object.fromEntries(url.searchParams))

  if (!parsed.success) return NextResponse.json({ error: "Invalid query" }, { status: 400 })

  const tenantId = parsed.data.tenantId as TenantId
  const unreadOnly = parsed.data.unreadOnly === "true"

  try {
    await requireTenantAccess(tenantId)
    const notifications = await getNotifications(tenantId, unreadOnly)
    return NextResponse.json({ notifications })
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

