import { NextResponse } from "next/server"
import { z } from "zod"
import { requireClubAccess } from "@/lib/auth/tenant-access"
import { getTenantSettings, upsertTenantSettings } from "@/lib/data/settings"
import { CLUB_TENANT_ID } from "@/lib/club"

export async function GET() {
  try {
    await requireClubAccess()
    const settings = await getTenantSettings(CLUB_TENANT_ID)
    return NextResponse.json({ settings })
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    return NextResponse.json({ error: e instanceof Error ? e.message : "Server error" }, { status: 500 })
  }
}

const UpdateSchema = z.object({
  settings: z.record(z.unknown()),
})

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = UpdateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 })

  try {
    const whoami = await requireClubAccess()
    if (whoami.user.role !== "admin" && whoami.user.role !== "community_manager") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const settings = await upsertTenantSettings(CLUB_TENANT_ID, parsed.data.settings)
    return NextResponse.json({ settings })
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    return NextResponse.json({ error: e instanceof Error ? e.message : "Server error" }, { status: 500 })
  }
}
