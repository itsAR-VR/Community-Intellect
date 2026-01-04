import { NextResponse } from "next/server"
import { z } from "zod"
import { getOpenAIClient } from "@/lib/ai/client"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) throw new Error("Missing env var: CRON_SECRET")
  return request.headers.get("authorization") === `Bearer ${secret}`
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })

  const url = new URL(request.url)
  const parsed = z.object({ openai: z.enum(["0", "1"]).optional() }).safeParse(Object.fromEntries(url.searchParams))
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Invalid query" }, { status: 400 })

  const checks: Record<string, unknown> = {}

  try {
    await prisma.tenant.findFirst({ select: { id: true } })
    checks.database = { ok: true }
  } catch (e) {
    checks.database = { ok: false, error: e instanceof Error ? e.message : "Database check failed" }
  }

  if (parsed.data.openai === "1") {
    try {
      const client = getOpenAIClient()
      // Minimal "is the key valid" check.
      await client.models.list()
      checks.openai = { ok: true }
    } catch (e) {
      checks.openai = { ok: false, error: e instanceof Error ? e.message : "OpenAI check failed" }
    }
  }

  const ok =
    (checks.database as any)?.ok === true &&
    (parsed.data.openai !== "1" || (checks.openai as any)?.ok === true)

  return NextResponse.json({ ok, checks }, { status: ok ? 200 : 500 })
}
