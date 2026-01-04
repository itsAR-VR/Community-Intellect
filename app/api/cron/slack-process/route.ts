import { runCronJob } from "@/app/api/cron/_utils"
import { runProcessSlackEvents } from "@/lib/cron/slack"

export const runtime = "nodejs"

export async function GET(request: Request) {
  const runKey = new Date().toISOString().slice(0, 16) // YYYY-MM-DDTHH:MM (UTC)
  return runCronJob({
    request,
    jobName: "slack:process_events",
    runKey,
    handler: async ({ nowIso, dryRun }) => runProcessSlackEvents({ nowIso, dryRun }),
  })
}
