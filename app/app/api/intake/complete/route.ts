import { NextResponse } from "next/server"
import { z } from "zod"
import { requireClubAccess } from "@/lib/auth/tenant-access"
import { CLUB_TENANT_ID } from "@/lib/club"
import { prisma } from "@/lib/prisma"
import { createFactForMember } from "@/lib/data/facts"
import { createAuditEntry } from "@/lib/data/audit"
import { getMemberIntakeCompleteness } from "@/lib/intake/completeness"

export const runtime = "nodejs"

const BodySchema = z.object({
  memberId: z.string().min(1),
  goal: z.string().min(1),
  bottleneck: z.string().min(1),
  stack: z.string().min(1),
  markWelcomeCallCompleted: z.boolean().optional(),
  markIntroPackDelivered: z.boolean().optional(),
  markProfileVerified: z.boolean().optional(),
  tryActivate: z.boolean().optional(),
})

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 })

  try {
    const whoami = await requireClubAccess()
    if (whoami.user.role === "read_only") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const member = await prisma.member.findFirst({ where: { id: parsed.data.memberId, tenantId: CLUB_TENANT_ID } })
    if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const now = new Date()
    const onboarding = (member.onboarding ?? {}) as any
    const nextOnboarding = {
      ...onboarding,
      intakeCompleted: true,
      intakeCompletedAt: now.toISOString(),
      welcomeCallCompleted: parsed.data.markWelcomeCallCompleted ?? onboarding.welcomeCallCompleted ?? false,
      welcomeCallAt:
        parsed.data.markWelcomeCallCompleted === true ? now.toISOString() : onboarding.welcomeCallAt ?? undefined,
      introPackDelivered: parsed.data.markIntroPackDelivered ?? onboarding.introPackDelivered ?? false,
      profileVerified: parsed.data.markProfileVerified ?? onboarding.profileVerified ?? false,
    }

    await prisma.member.update({
      where: { id: member.id },
      data: { onboarding: nextOnboarding, updatedAt: now },
    })

    await Promise.all([
      createFactForMember({
        tenantId: CLUB_TENANT_ID,
        memberId: member.id,
        category: "goal",
        key: "primary_goal",
        value: parsed.data.goal,
        provenance: "intake",
      }),
      createFactForMember({
        tenantId: CLUB_TENANT_ID,
        memberId: member.id,
        category: "bottleneck",
        key: "primary_bottleneck",
        value: parsed.data.bottleneck,
        provenance: "intake",
      }),
      createFactForMember({
        tenantId: CLUB_TENANT_ID,
        memberId: member.id,
        category: "stack",
        key: "stack_summary",
        value: parsed.data.stack,
        provenance: "intake",
      }),
    ])

    let activation: { ok: boolean; missing?: string[] } = { ok: false }
    if (parsed.data.tryActivate) {
      const gate = await getMemberIntakeCompleteness({ tenantId: CLUB_TENANT_ID, memberId: member.id })
      if (gate.ok) {
        await prisma.member.update({ where: { id: member.id }, data: { status: "active", updatedAt: now } })
        activation = { ok: true }
      } else {
        activation = { ok: false, missing: gate.missing }
      }
    }

    await createAuditEntry({
      tenantId: CLUB_TENANT_ID,
      type: "fact_updated",
      actorId: whoami.user.id,
      actor: whoami.user.name,
      actorRole: whoami.user.role,
      memberId: member.id,
      details: { source: "intake_complete" },
    }).catch(() => null)

    return NextResponse.json({ ok: true, activation })
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    return NextResponse.json({ error: e instanceof Error ? e.message : "Server error" }, { status: 500 })
  }
}

