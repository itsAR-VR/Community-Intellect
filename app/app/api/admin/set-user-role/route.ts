import { NextResponse } from "next/server"
import { z } from "zod"
import type { UserRole } from "@/lib/types"
import { requireClubAccess } from "@/lib/auth/tenant-access"
import { prisma } from "@/lib/prisma"

const BodySchema = z.object({
  userId: z.string(),
  role: z.enum(["admin", "community_manager", "read_only"]),
})

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 })

  const role = parsed.data.role as UserRole

  try {
    const whoami = await requireClubAccess()
    if (whoami.user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    await prisma.profile.update({ where: { id: parsed.data.userId }, data: { role, updatedAt: new Date() } })

    return NextResponse.json({ ok: true })
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    return NextResponse.json({ error: e instanceof Error ? e.message : "Server error" }, { status: 500 })
  }
}
