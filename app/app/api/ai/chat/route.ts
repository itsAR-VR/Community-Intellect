import { NextResponse } from "next/server"
import { z } from "zod"
import { requireClubAccess } from "@/lib/auth/tenant-access"
import { getOpenAIClient } from "@/lib/ai/client"
import { modelForTask } from "@/lib/ai/modelRouter"
import { appendChatMessage, createChatThread, getChatThreadById, getMembers, getOpportunities } from "@/lib/data"
import { CLUB_TENANT_ID } from "@/lib/club"

export const runtime = "nodejs"

const BodySchema = z.object({
  threadId: z.string().nullable().optional(),
  context: z
    .object({
      type: z.enum(["club", "member"]),
      memberId: z.string().optional(),
    })
    .optional(),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      }),
    )
    .min(1),
})

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 })

  try {
    const whoami = await requireClubAccess()
    if (whoami.user.role === "read_only") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const client = getOpenAIClient()
    const model = modelForTask("chat")

    const context = parsed.data.context ?? { type: "club" as const }
    const summary = await (async () => {
      if (context.type === "member" && context.memberId) return { mode: "member", memberId: context.memberId }

      const members = await getMembers(CLUB_TENANT_ID)
      const opps = await getOpportunities(CLUB_TENANT_ID)
      const atRisk = members.filter((m) => m.riskTier === "red").slice(0, 5).map((m) => ({
        id: m.id,
        name: `${m.firstName} ${m.lastName}`,
        company: m.company.name,
        riskScore: m.riskScore,
      }))
      return {
        mode: "club",
        memberCount: members.length,
        atRisk,
        openOpportunities: opps.filter((o) => !o.dismissed).length,
      }
    })()

    const systemPrompt = [
      "You are the retention intelligence assistant for a private B2B community.",
      "Be concise, actionable, and reference specific members when relevant.",
      "If you are unsure, ask a clarifying question.",
      `Context JSON:\n${JSON.stringify(summary, null, 2)}`,
    ].join("\n\n")

    let threadId = parsed.data.threadId ?? null
    if (!threadId) {
      const title = parsed.data.messages.find((m) => m.role === "user")?.content?.slice(0, 60) || "New chat"
      const thread = await createChatThread({
        tenantId: CLUB_TENANT_ID,
        createdBy: whoami.user.id,
        title,
        context: context.type === "member" ? { type: "member", memberId: context.memberId } : { type: "club" },
      })
      threadId = thread.id
    }

    const latestUser = parsed.data.messages[parsed.data.messages.length - 1]
    if (latestUser?.role === "user") {
      await appendChatMessage({ tenantId: CLUB_TENANT_ID, threadId, role: "user", content: latestUser.content })
    }

    const response = await client.responses.create({
      model,
      input: [{ role: "system", content: systemPrompt }, ...parsed.data.messages.map((m) => ({ role: m.role, content: m.content }))],
    })

    const assistantText = response.output_text || ""
    await appendChatMessage({ tenantId: CLUB_TENANT_ID, threadId, role: "assistant", content: assistantText })

    const thread = await getChatThreadById(CLUB_TENANT_ID, threadId)
    if (!thread) return NextResponse.json({ error: "Thread missing" }, { status: 500 })

    return NextResponse.json({ thread })
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    return NextResponse.json({ error: e instanceof Error ? e.message : "Server error" }, { status: 500 })
  }
}
