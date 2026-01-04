import { NextResponse } from "next/server"
import { randomUUID } from "crypto"
import { Prisma } from "@/lib/generated/prisma/client"
import { prisma } from "@/lib/prisma"
import { verifySlackSignature } from "@/lib/integrations/slack/verify"

export const runtime = "nodejs"

type SlackUrlVerification = { type: "url_verification"; challenge: string }
type SlackEventCallback = {
  type: "event_callback"
  team_id: string
  event_id: string
  event_time?: number
  event: { type: string; event_ts?: string; ts?: string }
}

export async function POST(request: Request) {
  const rawBody = await request.text()

  const signingSecret = process.env.SLACK_SIGNING_SECRET
  const allowUnverified = process.env.SLACK_ALLOW_UNVERIFIED_EVENTS === "1"
  if (!signingSecret && !allowUnverified) {
    return NextResponse.json(
      { ok: false, error: "Slack ingestion not configured (set SLACK_SIGNING_SECRET or SLACK_ALLOW_UNVERIFIED_EVENTS=1)" },
      { status: 503 },
    )
  }

  if (signingSecret) {
    const verify = verifySlackSignature({
      signingSecret,
      timestamp: request.headers.get("x-slack-request-timestamp"),
      signature: request.headers.get("x-slack-signature"),
      rawBody,
    })
    if (!verify.ok) return NextResponse.json({ ok: false, error: verify.error }, { status: 401 })
  }

  const payload = JSON.parse(rawBody || "{}") as SlackUrlVerification | SlackEventCallback | { type?: string }

  if (payload && (payload as SlackUrlVerification).type === "url_verification") {
    return NextResponse.json({ challenge: (payload as SlackUrlVerification).challenge })
  }

  if (!payload || (payload as any).type !== "event_callback") {
    return NextResponse.json({ ok: false, error: "Unsupported Slack payload" }, { status: 400 })
  }

  const event = payload as SlackEventCallback
  const eventTs = event.event?.event_ts ?? event.event?.ts ?? null
  const eventType = event.event?.type ?? "unknown"
  const tenantId = (process.env.SLACK_DEFAULT_TENANT_ID as string | undefined) ?? null

  try {
    await prisma.slackEvent.upsert({
      where: { eventId: event.event_id },
      create: {
        id: randomUUID(),
        tenantId,
        teamId: event.team_id,
        eventId: event.event_id,
        eventType,
        eventTs,
        payload: payload as unknown as Prisma.InputJsonValue,
      },
      update: {},
    })
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "Failed to store Slack event" }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
