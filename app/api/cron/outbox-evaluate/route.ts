import { runCronJob } from "@/app/api/cron/_utils"
import { runOutboxEvaluate } from "@/lib/cron/outbox"

export const runtime = "nodejs"

export async function GET(request: Request) {
  const runKey = new Date().toISOString().slice(0, 16) // YYYY-MM-DDTHH:MM (UTC)
  return runCronJob({
    request,
    jobName: "outbox:evaluate",
    runKey,
    handler: async ({ nowIso, dryRun }) => runOutboxEvaluate({ nowIso, dryRun }),
  })
}
