import { NextResponse } from "next/server"
import { z } from "zod"
import type { TenantId } from "@/lib/types"
import { requireTenantAccess } from "@/lib/auth/tenant-access"
import { getTenantSettings, upsertTenantSettings } from "@/lib/data/settings"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const parsed = z.object({ tenantId: z.string() }).safeParse(Object.fromEntries(url.searchParams))
  if (!parsed.success) return NextResponse.json({ error: "Invalid query" }, { status: 400 })

  const tenantId = parsed.data.tenantId as TenantId
  try {
    await requireTenantAccess(tenantId)
    const settings = await getTenantSettings(tenantId)
    return NextResponse.json({ settings })
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    return NextResponse.json({ error: e instanceof Error ? e.message : "Server error" }, { status: 500 })
  }
}

const UpdateSchema = z.object({
  tenantId: z.string(),
  settings: z.record(z.unknown()),
})

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = UpdateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 })

  const tenantId = parsed.data.tenantId as TenantId
  try {
    const whoami = await requireTenantAccess(tenantId)
    if (whoami.user.role !== "admin" && whoami.user.role !== "community_manager") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const settings = await upsertTenantSettings(tenantId, parsed.data.settings)
    return NextResponse.json({ settings })
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    return NextResponse.json({ error: e instanceof Error ? e.message : "Server error" }, { status: 500 })
  }
}

