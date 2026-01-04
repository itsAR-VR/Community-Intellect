import { runCronJob } from "@/app/api/cron/_utils"
import { runAutoSendDrafts } from "@/lib/cron/drafts"

export const runtime = "nodejs"

export async function GET(request: Request) {
  const runKey = new Date().toISOString().slice(0, 13) // YYYY-MM-DDTHH (UTC)
  return runCronJob({
    request,
    jobName: "drafts:autosend",
    runKey,
    handler: async ({ nowIso, dryRun }) => runAutoSendDrafts({ nowIso, dryRun }),
  })
}
