import "server-only"

import { z } from "zod"
import { getOpenAIClient } from "@/lib/ai/client"
import { modelForTask } from "@/lib/ai/modelRouter"
import { getFactsByMember, getSignalsByMember, getOpportunitiesByMember } from "@/lib/data"
import type { ActionType } from "@/lib/types"

const OutputSchema = z.object({
  content: z.string().min(1),
  autosendEligible: z.boolean(),
  blockedReasons: z.array(z.string()),
  sendRecommendation: z.enum(["send", "review", "hold"]),
})

export async function generateDraftMessage(input: { memberId: string; actionType: ActionType }): Promise<z.infer<typeof OutputSchema>> {
  if (!process.env.OPENAI_API_KEY) {
    return {
      content: `Draft (${input.actionType}): follow up with the member with a clear question and 1 concrete next step.`,
      autosendEligible: false,
      blockedReasons: ["OPENAI_API_KEY not set"],
      sendRecommendation: "review",
    }
  }

  const [facts, signals, opportunities] = await Promise.all([
    getFactsByMember(input.memberId),
    getSignalsByMember(input.memberId),
    getOpportunitiesByMember(input.memberId),
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
            actionType: input.actionType,
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
  return OutputSchema.parse(json)
}

