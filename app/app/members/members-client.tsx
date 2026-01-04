"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import type { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal, UserPlus, MessageSquare, Target } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DataTable } from "@/components/shared/data-table"
import { RiskBadge } from "@/components/shared/risk-badge"
import { StatusBadge } from "@/components/shared/status-badge"
import type { Member, MemberStatus, RiskTier } from "@/lib/types"
import { formatDistanceToNow } from "date-fns"
import { toast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"

export function MembersClient({ members }: { members: Member[] }) {
  const router = useRouter()
  const { canEdit } = useAuth()

  const [statusFilter, setStatusFilter] = React.useState<MemberStatus | "all">("all")
  const [riskFilter, setRiskFilter] = React.useState<RiskTier | "all">("all")

  const [createOpen, setCreateOpen] = React.useState(false)
  const [firstName, setFirstName] = React.useState("")
  const [lastName, setLastName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [companyName, setCompanyName] = React.useState("")
  const [companyRole, setCompanyRole] = React.useState("")
  const [status, setStatus] = React.useState<MemberStatus>("lead")
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const filteredMembers = members.filter((m) => {
    if (statusFilter !== "all" && m.status !== statusFilter) return false
    if (riskFilter !== "all" && m.riskTier !== riskFilter) return false
    return true
  })

  const columns: ColumnDef<Member>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Member
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const member = row.original
        return (
          <Link href={`/app/members/${member.id}`} className="flex items-center gap-3 hover:opacity-80">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-muted text-muted-foreground text-sm">
                {member.firstName[0]}
                {member.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">
                {member.firstName} {member.lastName}
              </p>
              <p className="text-xs text-muted-foreground">{member.email}</p>
            </div>
          </Link>
        )
      },
      filterFn: (row, id, value) => {
        const member = row.original
        const searchValue = value.toLowerCase()
        return (
          member.firstName.toLowerCase().includes(searchValue) ||
          member.lastName.toLowerCase().includes(searchValue) ||
          member.email.toLowerCase().includes(searchValue) ||
          member.company.name.toLowerCase().includes(searchValue)
        )
      },
    },
    {
      accessorKey: "company",
      header: "Company",
      cell: ({ row }) => {
        const member = row.original
        return (
          <div>
            <p className="font-medium">{member.company.name}</p>
            <p className="text-xs text-muted-foreground">{member.company.role}</p>
          </div>
        )
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: "riskTier",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Risk
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <RiskBadge tier={row.original.riskTier} score={row.original.riskScore} />,
      sortingFn: (rowA, rowB) => {
        const order = { red: 0, yellow: 1, green: 2 }
        return order[rowA.original.riskTier] - order[rowB.original.riskTier]
      },
    },
    {
      accessorKey: "engagementScore",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Engagement
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="h-2 w-16 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${row.original.engagementScore}%` }}
            />
          </div>
          <span className="text-sm tabular-nums">{row.original.engagementScore}</span>
        </div>
      ),
    },
    {
      accessorKey: "lastValueDropAt",
      header: "Last Value Drop",
      cell: ({ row }) => {
        const date = row.original.lastValueDropAt
        return date ? (
          <span className="text-sm text-muted-foreground">
            {formatDistanceToNow(new Date(date), { addSuffix: true })}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">Never</span>
        )
      },
    },
    {
      accessorKey: "renewalDate",
      header: "Renewal",
      cell: ({ row }) => {
        const date = row.original.renewalDate
        return date ? (
          <span className="text-sm">{new Date(date).toLocaleDateString()}</span>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        )
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const member = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => router.push(`/app/members/${member.id}`)}>
                View Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/app/drafts?member=${member.id}`)}>
                <MessageSquare className="mr-2 h-4 w-4" />
                Create Draft
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push(`/app/forced-success?member=${member.id}`)}>
                <Target className="mr-2 h-4 w-4" />
                Add to Forced Success
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Members</h1>
          <p className="text-muted-foreground">Manage and view all club members</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button disabled={!canEdit}>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Member</DialogTitle>
              <DialogDescription>Create a new member record for this tenant.</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>First name</Label>
                  <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" />
                </div>
                <div className="space-y-2">
                  <Label>Last name</Label>
                  <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" />
              </div>
              <div className="space-y-2">
                <Label>Company</Label>
                <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Company name" />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Input value={companyRole} onChange={(e) => setCompanyRole(e.target.value)} placeholder="e.g., CMO" />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as MemberStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lead">Lead</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="churned">Churned</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                disabled={!firstName || !lastName || !email || !companyName || !companyRole || isSubmitting || !canEdit}
                onClick={async () => {
                  setIsSubmitting(true)
                  try {
                    const res = await fetch("/app/api/members/create", {
                      method: "POST",
                      headers: { "content-type": "application/json" },
                      body: JSON.stringify({
                        firstName,
                        lastName,
                        email,
                        companyName,
                        companyRole,
                        status,
                      }),
                    })
                    if (!res.ok) throw new Error(await res.text())
                    toast({ title: "Member added" })
                    setCreateOpen(false)
                    setFirstName("")
                    setLastName("")
                    setEmail("")
                    setCompanyName("")
                    setCompanyRole("")
                    setStatus("lead")
                    router.refresh()
                  } catch (e) {
                    toast({ title: "Failed to add member", description: e instanceof Error ? e.message : "Unknown error" })
                  } finally {
                    setIsSubmitting(false)
                  }
                }}
              >
                {isSubmitting ? "Adding..." : "Add Member"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4">
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as MemberStatus | "all")}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="lead">Lead</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="churned">Churned</SelectItem>
          </SelectContent>
        </Select>

        <Select value={riskFilter} onValueChange={(v) => setRiskFilter(v as RiskTier | "all")}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Risk" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Risk Levels</SelectItem>
            <SelectItem value="green">Low Risk</SelectItem>
            <SelectItem value="yellow">Medium Risk</SelectItem>
            <SelectItem value="red">High Risk</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable columns={columns} data={filteredMembers} searchKey="name" searchPlaceholder="Search members..." />
    </div>
  )
}
