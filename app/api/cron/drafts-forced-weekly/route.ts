import { runCronJob } from "@/app/api/cron/_utils"
import { runGenerateForcedWeeklyDrafts } from "@/lib/cron/drafts"

export const runtime = "nodejs"

export async function GET(request: Request) {
  const runKey = new Date().toISOString().slice(0, 10) // YYYY-MM-DD (UTC)
  return runCronJob({
    request,
    jobName: "drafts:forced_weekly",
    runKey,
    handler: async ({ nowIso, dryRun }) => runGenerateForcedWeeklyDrafts({ nowIso, dryRun }),
  })
}

