import { NextResponse } from "next/server"
import { z } from "zod"
import { getNotifications } from "@/lib/data"
import { requireClubAccess } from "@/lib/auth/tenant-access"
import { CLUB_TENANT_ID } from "@/lib/club"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const parsed = z
    .object({
      unreadOnly: z.string().optional(),
    })
    .safeParse(Object.fromEntries(url.searchParams))

  if (!parsed.success) return NextResponse.json({ error: "Invalid query" }, { status: 400 })

  const unreadOnly = parsed.data.unreadOnly === "true"

  try {
    await requireClubAccess()
    const notifications = await getNotifications(CLUB_TENANT_ID, unreadOnly)
    return NextResponse.json({ notifications })
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
