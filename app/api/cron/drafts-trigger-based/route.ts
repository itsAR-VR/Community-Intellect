import { runCronJob } from "@/app/api/cron/_utils"
import { runGenerateTriggerBasedDrafts } from "@/lib/cron/drafts"

export const runtime = "nodejs"

export async function GET(request: Request) {
  const runKey = new Date().toISOString().slice(0, 13) // YYYY-MM-DDTHH (UTC)
  return runCronJob({
    request,
    jobName: "drafts:trigger_based",
    runKey,
    handler: async ({ nowIso, dryRun }) => runGenerateTriggerBasedDrafts({ nowIso, dryRun }),
  })
}
