import "server-only"

import { createHmac, timingSafeEqual } from "crypto"

const FIVE_MINUTES_SECONDS = 60 * 5

export function verifySlackSignature(input: {
  signingSecret: string
  timestamp: string | null
  signature: string | null
  rawBody: string
  nowMs?: number
}): { ok: true } | { ok: false; error: string } {
  if (!input.timestamp) return { ok: false, error: "Missing Slack timestamp header" }
  if (!input.signature) return { ok: false, error: "Missing Slack signature header" }

  const ts = Number(input.timestamp)
  if (!Number.isFinite(ts)) return { ok: false, error: "Invalid Slack timestamp header" }

  const nowSec = Math.floor((input.nowMs ?? Date.now()) / 1000)
  if (Math.abs(nowSec - ts) > FIVE_MINUTES_SECONDS) return { ok: false, error: "Slack request timestamp out of range" }

  const base = `v0:${input.timestamp}:${input.rawBody}`
  const computed = `v0=${createHmac("sha256", input.signingSecret).update(base).digest("hex")}`

  const a = Buffer.from(computed, "utf8")
  const b = Buffer.from(input.signature, "utf8")
  if (a.length !== b.length) return { ok: false, error: "Slack signature mismatch" }
  if (!timingSafeEqual(a as unknown as Uint8Array, b as unknown as Uint8Array)) {
    return { ok: false, error: "Slack signature mismatch" }
  }

  return { ok: true }
}
