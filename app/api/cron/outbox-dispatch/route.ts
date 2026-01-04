import { runCronJob } from "@/app/api/cron/_utils"
import { runOutboxDispatch } from "@/lib/cron/outbox"

export const runtime = "nodejs"

export async function GET(request: Request) {
  const runKey = new Date().toISOString().slice(0, 16) // YYYY-MM-DDTHH:MM (UTC)
  return runCronJob({
    request,
    jobName: "outbox:dispatch",
    runKey,
    handler: async ({ nowIso, dryRun }) => runOutboxDispatch({ nowIso, dryRun }),
  })
}
