import { runCronJob } from "@/app/api/cron/_utils"
import { runDailyRollups } from "@/lib/cron/jobs"

export const runtime = "nodejs"

export async function GET(request: Request) {
  const runKey = new Date().toISOString().slice(0, 10) // YYYY-MM-DD (UTC)
  return runCronJob({
    request,
    jobName: "rollups:daily",
    runKey,
    handler: async ({ nowIso }) => runDailyRollups({ nowIso }),
  })
}
