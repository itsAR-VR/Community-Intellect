import { NextResponse } from "next/server"
import { z } from "zod"
import { requireClubAccess } from "@/lib/auth/tenant-access"
import { getOpenAIClient } from "@/lib/ai/client"
import { modelForTask } from "@/lib/ai/modelRouter"
import { getFactsByMember, getSignalsByMember, getOpportunitiesByMember } from "@/lib/data"

export const runtime = "nodejs"

const BodySchema = z.object({
  memberId: z.string(),
  actionType: z.string(),
})

const OutputSchema = z.object({
  content: z.string().min(1),
  autosendEligible: z.boolean(),
  blockedReasons: z.array(z.string()),
  sendRecommendation: z.enum(["send", "review", "hold"]),
})

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  try {
    const whoami = await requireClubAccess()
    if (whoami.user.role === "read_only") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const [facts, signals, opportunities] = await Promise.all([
      getFactsByMember(parsed.data.memberId),
      getSignalsByMember(parsed.data.memberId),
      getOpportunitiesByMember(parsed.data.memberId),
    ])

    const client = getOpenAIClient()
    const model = modelForTask("draft_message")

    const response = await client.responses.create({
      model,
      input: [
        {
          role: "system",
          content:
            "You write short, professional 1:1 member messages for a community manager. Output strict JSON with: content, autosendEligible, blockedReasons[], sendRecommendation (send|review|hold).",
        },
        {
          role: "user",
          content: JSON.stringify(
            {
              actionType: parsed.data.actionType,
              context: {
                facts: facts.slice(0, 10),
                signals: signals.slice(0, 10),
                opportunities: opportunities.filter((o) => !o.dismissed).slice(0, 5),
              },
            },
            null,
            2,
          ),
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "draft_message",
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              content: { type: "string" },
              autosendEligible: { type: "boolean" },
              blockedReasons: { type: "array", items: { type: "string" } },
              sendRecommendation: { type: "string", enum: ["send", "review", "hold"] },
            },
            required: ["content", "autosendEligible", "blockedReasons", "sendRecommendation"],
          },
        },
      },
    })

    const json = JSON.parse(response.output_text || "{}")
    const out = OutputSchema.parse(json)
    return NextResponse.json({ draft: out })
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    return NextResponse.json({ error: e instanceof Error ? e.message : "Server error" }, { status: 500 })
  }
}
