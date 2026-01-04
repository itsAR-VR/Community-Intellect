import { NextResponse } from "next/server"
import { z } from "zod"
import { randomUUID } from "crypto"
import { requireClubAccess } from "@/lib/auth/tenant-access"
import { CLUB_TENANT_ID } from "@/lib/club"
import { prisma } from "@/lib/prisma"
import { updateOutboundMessage } from "@/lib/data/outbound-messages"
import { createAuditEntry } from "@/lib/data/audit"

const BodySchema = z.object({ id: z.string().min(1) })

export const runtime = "nodejs"

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 })

  try {
    const whoami = await requireClubAccess()
    if (whoami.user.role === "read_only") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const existing = await prisma.outboundMessage.findFirst({
      where: { id: parsed.data.id, tenantId: CLUB_TENANT_ID },
      select: { id: true, memberId: true, draftId: true, body: true },
    })
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const nowIso = new Date().toISOString()
    const message = await updateOutboundMessage(existing.id, {
      status: "sent",
      sentAt: nowIso,
      externalId: `simulated:${existing.id}`,
      error: "",
    })

    await prisma.interactionLog.create({
      data: {
        id: randomUUID(),
        tenantId: CLUB_TENANT_ID,
        memberId: existing.memberId,
        type: "dm",
        channel: "slack",
        summary: existing.body.slice(0, 180),
        draftId: existing.draftId ?? null,
        createdBy: whoami.user.id,
        createdAt: new Date(),
      },
    })

    await prisma.member.update({
      where: { id: existing.memberId },
      data: { lastContactedAt: new Date(), lastValueDropAt: new Date(), updatedAt: new Date() },
    })

    await prisma.slackDmThread
      .updateMany({
        where: { tenantId: CLUB_TENANT_ID, memberId: existing.memberId },
        data: { lastMessageAt: new Date(), lastCmMessageAt: new Date(), updatedAt: new Date() },
      })
      .catch(() => null)

    await createAuditEntry({
      tenantId: CLUB_TENANT_ID,
      type: "outbound_message_sent",
      actorId: whoami.user.id,
      actor: whoami.user.name,
      actorRole: whoami.user.role,
      memberId: existing.memberId,
      details: { outboundMessageId: existing.id },
    }).catch(() => null)

    return NextResponse.json({ message })
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    return NextResponse.json({ error: e instanceof Error ? e.message : "Server error" }, { status: 500 })
  }
}
