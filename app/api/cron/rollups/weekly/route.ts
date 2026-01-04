import { runCronJob } from "@/app/api/cron/_utils"
import { runDailyRollups } from "@/lib/cron/jobs"

export const runtime = "nodejs"

function isoWeekKey(d: Date): string {
  // ISO week key like 2026-W01 (UTC)
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`
}

export async function GET(request: Request) {
  const runKey = isoWeekKey(new Date())
  return runCronJob({
    request,
    jobName: "rollups:weekly",
    runKey,
    handler: async ({ nowIso }) => runDailyRollups({ nowIso }),
  })
}
