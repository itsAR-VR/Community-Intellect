import { NextResponse } from "next/server"
import { z } from "zod"
import type { ContactState } from "@/lib/types"
import { updateMember } from "@/lib/data/members"
import { requireClubAccess } from "@/lib/auth/tenant-access"
import { CLUB_TENANT_ID } from "@/lib/club"
import { createAuditEntry } from "@/lib/data/audit"
import { prisma } from "@/lib/prisma"

const BodySchema = z.object({
  memberId: z.string().min(1),
  contactState: z.enum(["open", "closed", "muted"]),
})

export const runtime = "nodejs"

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 })

  try {
    const whoami = await requireClubAccess()
    if (whoami.user.role === "read_only") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const contactState = parsed.data.contactState as ContactState
    const member = await updateMember(parsed.data.memberId, { contactState })
    if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 })

    // Keep Slack DM thread "closed" state in sync (manual gating support).
    const now = new Date()
    if (contactState === "closed") {
      await prisma.slackDmThread
        .updateMany({
          where: { tenantId: CLUB_TENANT_ID, memberId: member.id },
          data: { conversationClosedAt: now, updatedAt: now },
        })
        .catch(() => null)
    } else if (contactState === "open") {
      await prisma.slackDmThread
        .updateMany({
          where: { tenantId: CLUB_TENANT_ID, memberId: member.id },
          data: { conversationClosedAt: null, updatedAt: now },
        })
        .catch(() => null)
    }

    await createAuditEntry({
      tenantId: CLUB_TENANT_ID,
      type: "contact_state_changed",
      actorId: whoami.user.id,
      actor: whoami.user.name,
      actorRole: whoami.user.role,
      memberId: member.id,
      details: { memberId: member.id, contactState },
    }).catch(() => null)

    return NextResponse.json({ member })
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    return NextResponse.json({ error: e instanceof Error ? e.message : "Server error" }, { status: 500 })
  }
}
