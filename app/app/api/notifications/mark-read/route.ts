import { NextResponse } from "next/server"
import { z } from "zod"
import { markNotificationRead } from "@/lib/data"
import { requireClubAccess } from "@/lib/auth/tenant-access"

const BodySchema = z.object({
  notificationId: z.string(),
})

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 })

  try {
    await requireClubAccess()
    const notification = await markNotificationRead(parsed.data.notificationId)
    return NextResponse.json({ notification })
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
