import "server-only"

import { Prisma } from "@/lib/generated/prisma/client"
import { prisma } from "@/lib/prisma"

type BeginResult =
  | { kind: "started"; runId: bigint | null; tracking: boolean }
  | { kind: "skipped"; reason: "already_succeeded" | "already_running" }

function isUniqueViolation(err: any): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002"
}

function isMissingTable(err: any, table: string): boolean {
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2021") {
    return typeof err.meta?.table === "string" ? err.meta.table.includes(table) : true
  }
  // Some adapters can surface the raw Postgres code.
  return err?.code === "42P01" && typeof err?.message === "string" && err.message.includes(table)
}

export async function beginCronRun(input: {
  jobName: string
  runKey: string
  nowIso: string
}): Promise<BeginResult> {
  try {
    const inserted = await prisma.cronJobRun.create({
      data: { jobName: input.jobName, runKey: input.runKey, status: "started", startedAt: new Date(input.nowIso), details: {} },
      select: { id: true },
    })
    return { kind: "started", runId: inserted.id, tracking: true }
  } catch (err) {
    if (isMissingTable(err, "cron_job_runs")) return { kind: "started", runId: null, tracking: false }
    if (!isUniqueViolation(err)) throw err
  }

  const existing = await prisma.cronJobRun.findUnique({
    where: { jobName_runKey: { jobName: input.jobName, runKey: input.runKey } },
    select: { id: true, status: true, startedAt: true },
  })
  if (!existing) throw new Error("Invariant: cron run exists but could not be loaded")

  if (existing.status === "success") return { kind: "skipped", reason: "already_succeeded" }

  if (existing.status === "started") {
    const startedAtMs = existing.startedAt ? existing.startedAt.getTime() : null
    const nowMs = Date.parse(input.nowIso)
    const isStale = startedAtMs ? nowMs - startedAtMs > 15 * 60 * 1000 : false
    if (!isStale) return { kind: "skipped", reason: "already_running" }
  }

  await prisma.cronJobRun.update({
    where: { id: existing.id },
    data: { status: "started", startedAt: new Date(input.nowIso), finishedAt: null, details: {} },
  })

  return { kind: "started", runId: existing.id, tracking: true }
}

export async function finishCronRun(input: {
  runId: bigint | null
  status: "success" | "error"
  nowIso: string
  details: Record<string, unknown>
}) {
  if (typeof input.runId !== "bigint") return
  await prisma.cronJobRun.update({
    where: { id: input.runId },
    data: { status: input.status, finishedAt: new Date(input.nowIso), details: input.details as Prisma.InputJsonValue },
  })
}
