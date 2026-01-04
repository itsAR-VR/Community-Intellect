import { NextResponse } from "next/server"
import { z } from "zod"
import { requireClubAccess } from "@/lib/auth/tenant-access"
import { getOpenAIClient } from "@/lib/ai/client"
import { modelForTask } from "@/lib/ai/modelRouter"

export const runtime = "nodejs"

const BodySchema = z.object({
  signals: z
    .array(
      z.object({
        company: z.string().min(1),
        whatHappened: z.string().min(1),
        type: z.string().optional(),
      }),
    )
    .min(1),
})

const OutputSchema = z.object({
  post: z.string().min(1),
})

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 })

  try {
    const whoami = await requireClubAccess()
    if (whoami.user.role === "read_only") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const client = getOpenAIClient()
    const model = modelForTask("generate_post")

    const response = await client.responses.create({
      model,
      input: [
        {
          role: "system",
          content: [
            "You write concise Slack posts for a private B2B community.",
            "Write a weekly #market-signals post with:",
            "- A short headline line",
            "- Bullet points (one per company)",
            "- A short closing line",
            "- Hashtags: #B2BMarketing #CMO",
            "Keep it professional, specific, and under ~1200 characters.",
            "Return strict JSON: { post: string }",
          ].join("\n"),
        },
        {
          role: "user",
          content: JSON.stringify(
            {
              signals: parsed.data.signals,
            },
            null,
            2,
          ),
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "market_signals_post",
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              post: { type: "string" },
            },
            required: ["post"],
          },
        },
      },
    })

    const json = JSON.parse(response.output_text || "{}")
    const out = OutputSchema.parse(json)
    return NextResponse.json(out)
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    return NextResponse.json({ error: e instanceof Error ? e.message : "Server error" }, { status: 500 })
  }
}
