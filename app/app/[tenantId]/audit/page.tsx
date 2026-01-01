"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Eye } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DataTable } from "@/components/shared/data-table"
import { mockMembers, mockAuditLogs } from "@/lib/mock-data"
import type { TenantId, AuditEventType } from "@/lib/types"
import { format, formatDistanceToNow } from "date-fns"
import type { ColumnDef } from "@tanstack/react-table"

const eventTypeLabels: Record<AuditEventType, string> = {
  draft_created: "Draft Created",
  draft_sent: "Draft Sent",
  draft_merged: "Draft Merged",
  contact_state_changed: "Contact State Changed",
  intro_created: "Intro Created",
  perk_delivered: "Perk Delivered",
  outcome_recorded: "Outcome Recorded",
  forced_success_delivered: "Forced Success Delivered",
  fact_updated: "Fact Updated",
  fact_verified: "Fact Verified",
  member_status_changed: "Member Status Changed",
  settings_changed: "Settings Changed",
}

export default function AuditPage() {
  const params = useParams()
  const tenantId = params.tenantId as TenantId

  const [typeFilter, setTypeFilter] = React.useState<AuditEventType | "all">("all")
  const [selectedLog, setSelectedLog] = React.useState<(typeof mockAuditLogs)[0] | null>(null)

  const logs = mockAuditLogs.filter((l) => l.tenantId === tenantId)
  const filteredLogs = logs.filter((l) => typeFilter === "all" || l.type === typeFilter)

  const columns: ColumnDef<(typeof mockAuditLogs)[0]>[] = [
    {
      accessorKey: "type",
      header: "Event",
      cell: ({ row }) => (
        <Badge variant="outline" className="text-xs">
          {eventTypeLabels[row.original.type]}
        </Badge>
      ),
    },
    {
      accessorKey: "actor",
      header: "Actor",
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-sm">{row.original.actor}</p>
          <p className="text-xs text-muted-foreground capitalize">{row.original.actorRole.replace("_", " ")}</p>
        </div>
      ),
    },
    {
      accessorKey: "memberId",
      header: "Member",
      cell: ({ row }) => {
        if (!row.original.memberId) return <span className="text-muted-foreground">—</span>
        const member = mockMembers.find((m) => m.id === row.original.memberId)
        if (!member) return <span className="text-muted-foreground">Unknown</span>
        return (
          <Link href={`/app/${tenantId}/members/${member.id}`} className="text-sm hover:underline">
            {member.firstName} {member.lastName}
          </Link>
        )
      },
    },
    {
      accessorKey: "createdAt",
      header: "Time",
      cell: ({ row }) => (
        <div>
          <p className="text-sm">{format(new Date(row.original.createdAt), "MMM d, h:mm a")}</p>
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(row.original.createdAt), { addSuffix: true })}
          </p>
        </div>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" onClick={() => setSelectedLog(row.original)}>
              <Eye className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Audit Log Details</DialogTitle>
              <DialogDescription>{eventTypeLabels[row.original.type]}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Actor</p>
                  <p className="font-medium">{row.original.actor}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Role</p>
                  <p className="font-medium capitalize">{row.original.actorRole.replace("_", " ")}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Time</p>
                  <p className="font-medium">{format(new Date(row.original.createdAt), "PPpp")}</p>
                </div>
                {row.original.memberId && (
                  <div>
                    <p className="text-sm text-muted-foreground">Member</p>
                    <p className="font-medium">
                      {(() => {
                        const member = mockMembers.find((m) => m.id === row.original.memberId)
                        return member ? `${member.firstName} ${member.lastName}` : "Unknown"
                      })()}
                    </p>
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Details (JSON)</p>
                <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto max-h-[200px]">
                  {JSON.stringify(row.original.details, null, 2)}
                </pre>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Log</h1>
          <p className="text-muted-foreground">Track all system activities and changes</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as AuditEventType | "all")}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Event type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Events</SelectItem>
            {Object.entries(eventTypeLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Badge variant="secondary">{filteredLogs.length} events</Badge>
      </div>

      <Card>
        <CardContent className="pt-6">
          <DataTable columns={columns} data={filteredLogs} />
        </CardContent>
      </Card>
    </div>
  )
}
