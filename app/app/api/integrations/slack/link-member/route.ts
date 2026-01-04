import { NextResponse } from "next/server"
import { z } from "zod"
import { requireClubAccess } from "@/lib/auth/tenant-access"
import { CLUB_TENANT_ID } from "@/lib/club"
import { upsertSlackIdentityForMember } from "@/lib/data/slack"

export const runtime = "nodejs"

const BodySchema = z.object({
  memberId: z.string().min(1),
  teamId: z.string().min(1),
  slackUserId: z.string().min(1),
  slackChannelId: z.string().min(1).optional(),
  slackEmail: z.string().email().optional(),
  slackDisplayName: z.string().min(1).optional(),
})

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 })

  try {
    const whoami = await requireClubAccess()
    if (whoami.user.role === "read_only") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const result = await upsertSlackIdentityForMember({
      tenantId: CLUB_TENANT_ID,
      memberId: parsed.data.memberId,
      teamId: parsed.data.teamId,
      slackUserId: parsed.data.slackUserId,
      slackEmail: parsed.data.slackEmail,
      slackDisplayName: parsed.data.slackDisplayName,
      slackChannelId: parsed.data.slackChannelId,
    })

    return NextResponse.json({ ok: true, ...result })
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    return NextResponse.json({ error: e instanceof Error ? e.message : "Server error" }, { status: 500 })
  }
}

