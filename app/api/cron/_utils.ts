import { NextResponse } from "next/server"
import { isAuthorizedCronRequest } from "@/lib/cron/auth"
import { beginCronRun, finishCronRun } from "@/lib/cron/run"

export async function runCronJob<T extends Record<string, unknown>>(input: {
  request: Request
  jobName: string
  runKey: string
  handler: (ctx: { nowIso: string; dryRun: boolean }) => Promise<T>
}) {
  if (!isAuthorizedCronRequest(input.request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const url = new URL(input.request.url)
  const dryRun = url.searchParams.get("dryRun") === "1"

  const nowIso = new Date().toISOString()

  const begin = await beginCronRun({ jobName: input.jobName, runKey: input.runKey, nowIso })
  if (begin.kind === "skipped") {
    return NextResponse.json({ ok: true, skipped: true, reason: begin.reason, jobName: input.jobName, runKey: input.runKey })
  }

  try {
    const details = await input.handler({ nowIso, dryRun })
    if (begin.tracking) {
      await finishCronRun({
        runId: begin.runId,
        status: "success",
        nowIso: new Date().toISOString(),
        details: { dryRun, ...details },
      })
    }
    return NextResponse.json({ ok: true, skipped: false, tracking: begin.tracking, jobName: input.jobName, runKey: input.runKey, dryRun, details })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Cron job error"
    if (begin.tracking) {
      await finishCronRun({
        runId: begin.runId,
        status: "error",
        nowIso: new Date().toISOString(),
        details: { dryRun, error: message },
      }).catch(() => null)
    }
    return NextResponse.json({ ok: false, error: message, jobName: input.jobName, runKey: input.runKey }, { status: 500 })
  }
}
