import { NextResponse } from "next/server"
import { z } from "zod"
import { randomUUID } from "crypto"
import type { SurveyCadence, TenantId } from "@/lib/types"
import { sendSurvey } from "@/lib/data/surveys"
import { createAuditEntry } from "@/lib/data/audit"
import { requireTenantAccess } from "@/lib/auth/tenant-access"

const BodySchema = z.object({
  tenantId: z.string(),
  memberIds: z.array(z.string()).min(1),
  cadence: z.enum(["weekly", "biweekly", "monthly", "quarterly"]),
})

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 })

  const tenantId = parsed.data.tenantId as TenantId
  const cadence = parsed.data.cadence as SurveyCadence

  try {
    const whoami = await requireTenantAccess(tenantId)

    const surveys = []
    for (const memberId of parsed.data.memberIds) {
      const survey = await sendSurvey({ id: `sur_${randomUUID().slice(0, 8)}`, tenantId, memberId, cadence })
      surveys.push(survey)

      await createAuditEntry({
        tenantId,
        type: "survey_sent",
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
