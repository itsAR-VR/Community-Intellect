import { NextResponse } from "next/server"
import { CLUB_TENANT_ID } from "@/lib/club"
import { requireClubAccess } from "@/lib/auth/tenant-access"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    await requireClubAccess()

    const [members, drafts] = await Promise.all([
      prisma.member.findMany({
        where: { tenantId: CLUB_TENANT_ID },
        select: { id: true, firstName: true, lastName: true, email: true, companyName: true, companyRole: true },
        orderBy: { lastName: "asc" },
        take: 8,
      }),
      prisma.messageDraft.findMany({
        where: { tenantId: CLUB_TENANT_ID, status: "pending" },
        select: { id: true, memberId: true, actionType: true, content: true, status: true },
        orderBy: { createdAt: "desc" },
        take: 6,
      }),
    ])

    const draftMemberIds = Array.from(
      new Set((drafts ?? []).map((d) => d.memberId).filter((id): id is string => typeof id === "string" && id.length > 0)),
    )

    const draftMembers = await prisma.member.findMany({
      where: { tenantId: CLUB_TENANT_ID, ...(draftMemberIds.length > 0 ? { id: { in: draftMemberIds } } : { id: "__none__" }) },
      select: { id: true, firstName: true, lastName: true, email: true, companyName: true, companyRole: true },
    })

    const draftMemberById = new Map(
      (draftMembers ?? []).map((m) => [
        m.id,
        {
          id: m.id,
          firstName: m.firstName,
          lastName: m.lastName,
          email: m.email,
          company: { name: m.companyName, role: m.companyRole },
        },
      ]),
    )

    return NextResponse.json({
      members: (members ?? []).map((m) => ({
        id: m.id,
        firstName: m.firstName,
        lastName: m.lastName,
        email: m.email,
        company: { name: m.companyName, role: m.companyRole },
      })),
      drafts: (drafts ?? []).map((d) => ({
        id: d.id,
        memberId: d.memberId,
        actionType: d.actionType,
        content: d.content,
        status: d.status,
        member: draftMemberById.get(d.memberId ?? "") ?? null,
      })),
    })
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
