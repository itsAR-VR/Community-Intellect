import { NextResponse } from "next/server"
import { z } from "zod"
import { randomUUID } from "crypto"
import type { SurveyCadence } from "@/lib/types"
import { sendSurvey } from "@/lib/data/surveys"
import { createAuditEntry } from "@/lib/data/audit"
import { requireClubAccess } from "@/lib/auth/tenant-access"
import { CLUB_TENANT_ID } from "@/lib/club"

const BodySchema = z.object({
  memberIds: z.array(z.string()).min(1),
  cadence: z.enum(["weekly", "biweekly", "monthly", "quarterly"]),
})

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 })

  const cadence = parsed.data.cadence as SurveyCadence

  try {
    const whoami = await requireClubAccess()
    if (whoami.user.role === "read_only") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const surveys = []
    for (const memberId of parsed.data.memberIds) {
      const survey = await sendSurvey({ id: `sur_${randomUUID().slice(0, 8)}`, tenantId: CLUB_TENANT_ID, memberId, cadence })
      surveys.push(survey)

      await createAuditEntry({
        tenantId: CLUB_TENANT_ID,
        type: "survey_sent",
        actorId: whoami.user.id,
        actor: whoami.user.name,
        actorRole: whoami.user.role,
        memberId,
        details: { surveyId: survey.id, cadence },
      })
    }

    return NextResponse.json({ surveys })
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    return NextResponse.json({ error: e instanceof Error ? e.message : "Server error" }, { status: 500 })
  }
}
