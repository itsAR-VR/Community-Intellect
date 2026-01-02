import { NextResponse } from "next/server"
import { z } from "zod"
import { getOpenAIClient } from "@/lib/ai/client"
import { modelForTask } from "@/lib/ai/modelRouter"

const BodySchema = z.object({
  text: z.string().min(1),
})

const OutputSchema = z.object({
  signalType: z.enum([
    "hiring",
    "funding",
    "expansion",
    "contraction",
    "milestone",
    "pain_point",
    "engagement",
    "sentiment",
    "mention",
    "request",
  ]),
  urgency: z.number().int().min(1).max(10),
  tags: z.array(z.string()).max(12),
  impliedNeeds: z.array(z.string()).max(12),
})

export const runtime = "nodejs"

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 })

  try {
    const client = getOpenAIClient()
    const model = modelForTask("classify_signal")

    const response = await client.responses.create({
      model,
      input: [
        {
          role: "system",
          content:
            "You classify short B2B community signals. Return strict JSON with: signalType, urgency (1-10), tags[], impliedNeeds[].",
        },
        { role: "user", content: parsed.data.text },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "signal_classification",
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              signalType: {
                type: "string",
                enum: [
                  "hiring",
                  "funding",
                  "expansion",
                  "contraction",
                  "milestone",
                  "pain_point",
                  "engagement",
                  "sentiment",
                  "mention",
                  "request",
                ],
              },
              urgency: { type: "integer", minimum: 1, maximum: 10 },
              tags: { type: "array", items: { type: "string" }, maxItems: 12 },
              impliedNeeds: { type: "array", items: { type: "string" }, maxItems: 12 },
            },
            required: ["signalType", "urgency", "tags", "impliedNeeds"],
          },
        },
      },
    })

    const text = response.output_text
    const json = JSON.parse(text || "{}")
    const out = OutputSchema.parse(json)
    return NextResponse.json(out)
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Server error" }, { status: 500 })
  }
}

