"use client"

import * as React from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DataTable } from "@/components/shared/data-table"
import { toast } from "@/hooks/use-toast"
import type { Member, OutboundMessage } from "@/lib/types"
import type { SlackDmThreadRow } from "@/lib/integrations/slack/types"
import type { ColumnDef } from "@tanstack/react-table"
import { format, formatDistanceToNow } from "date-fns"

function computeAutosendGate(input: { dm?: SlackDmThreadRow; nowMs: number }): { ok: boolean; reason?: string } {
  const dm = input.dm
  if (!dm) return { ok: false, reason: "No DM thread mapped" }
  if (!dm.lastMessageAt) return { ok: false, reason: "No last message timestamp" }
  const hasMemberReplied = !!dm.memberRepliedAt
  const isClosed = !!dm.conversationClosedAt
  if (!hasMemberReplied && !isClosed) return { ok: false, reason: "Waiting for member reply or close" }

  const lastMessageMs = Date.parse(dm.lastMessageAt)
  if (!Number.isFinite(lastMessageMs)) return { ok: false, reason: "Invalid last message timestamp" }
  if (input.nowMs - lastMessageMs < 24 * 60 * 60 * 1000) return { ok: false, reason: "24h cooldown not met" }

  return { ok: true }
}

const statusLabel: Record<OutboundMessage["status"], string> = {
  queued: "Queued",
  blocked: "Blocked",
  ready: "Ready",
  sent: "Sent",
  error: "Error",
}

export function OutboxClient({
  members,
  messages: initialMessages,
  dmThreads,
}: {
  members: Member[]
  messages: OutboundMessage[]
  dmThreads: SlackDmThreadRow[]
}) {
  const [messages, setMessages] = React.useState(initialMessages)

  const byMemberId = React.useMemo(() => new Map(members.map((m) => [m.id, m])), [members])
  const dmByMemberId = React.useMemo(() => new Map(dmThreads.map((d) => [d.memberId, d])), [dmThreads])

  const markSent = async (id: string) => {
    try {
      const res = await fetch("/app/api/outbox/mark-sent", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) throw new Error(await res.text())
      const json = (await res.json()) as { message: OutboundMessage }
      setMessages((prev) => prev.map((m) => (m.id === id ? json.message : m)))
      toast({ title: "Marked sent" })
    } catch (e) {
      toast({ title: "Failed", description: e instanceof Error ? e.message : "Unknown error" })
    }
  }

  const requeue = async (id: string) => {
    try {
      const res = await fetch("/app/api/outbox/requeue", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) throw new Error(await res.text())
      const json = (await res.json()) as { message: OutboundMessage }
      setMessages((prev) => prev.map((m) => (m.id === id ? json.message : m)))
      toast({ title: "Re-queued" })
    } catch (e) {
      toast({ title: "Failed", description: e instanceof Error ? e.message : "Unknown error" })
    }
  }

  const columns: ColumnDef<OutboundMessage>[] = [
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const m = row.original
        const variant = m.status === "sent" ? "default" : m.status === "error" ? "destructive" : "secondary"
        return (
          <div className="space-y-1">
            <Badge variant={variant as any} className="text-xs">
              {statusLabel[m.status]}
            </Badge>
            {m.status === "blocked" && m.error && <div className="text-xs text-muted-foreground">{m.error}</div>}
          </div>
        )
      },
    },
    {
      accessorKey: "memberId",
      header: "Member",
      cell: ({ row }) => {
        const member = byMemberId.get(row.original.memberId)
        if (!member) return <span className="text-muted-foreground">Unknown</span>
        return (
          <Link href={`/app/members/${member.id}`} className="text-sm hover:underline">
            {member.firstName} {member.lastName}
          </Link>
        )
      },
    },
    {
      accessorKey: "messageType",
      header: "Type",
      cell: ({ row }) => (
        <Badge variant="outline" className="text-xs">
          {row.original.messageType}
        </Badge>
      ),
    },
    {
      accessorKey: "sendAs",
      header: "Send As",
      cell: ({ row }) => (
        <Badge variant="outline" className="text-xs capitalize">
          {row.original.sendAs.replace("_", " ")}
        </Badge>
      ),
    },
    {
      accessorKey: "body",
      header: "Message",
      cell: ({ row }) => <div className="max-w-[520px] truncate text-sm">{row.original.body}</div>,
    },
    {
      accessorKey: "queuedAt",
      header: "Queued",
      cell: ({ row }) => (
        <div className="text-sm">
          <div>{format(new Date(row.original.queuedAt), "MMM d, h:mm a")}</div>
          <div className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(row.original.queuedAt), { addSuffix: true })}
          </div>
        </div>
      ),
    },
    {
      id: "gate",
      header: "Auto-send Gate",
      cell: ({ row }) => {
        const dm = dmByMemberId.get(row.original.memberId)
        const gate = computeAutosendGate({ dm, nowMs: Date.now() })
        return (
          <div className="text-xs">
            <Badge variant={gate.ok ? "default" : "secondary"} className="text-xs">
              {gate.ok ? "OK" : "Blocked"}
            </Badge>
            {!gate.ok && gate.reason && <div className="text-muted-foreground mt-1">{gate.reason}</div>}
          </div>
        )
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const m = row.original
        return (
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="outline" className="bg-transparent" onClick={() => requeue(m.id)}>
              Requeue
            </Button>
            <Button size="sm" onClick={() => markSent(m.id)} disabled={m.status === "sent"}>
              Mark Sent
            </Button>
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Outbox</h1>
        <p className="text-muted-foreground">Queued messages waiting for Slack delivery (Phase 1 uses simulated send).</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <DataTable columns={columns} data={messages} />
        </CardContent>
      </Card>
    </div>
  )
}
