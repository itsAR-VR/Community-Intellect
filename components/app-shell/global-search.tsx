"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Button } from "@/components/ui/button"
import type { TenantId } from "@/lib/types"

interface GlobalSearchProps {
  tenantId: TenantId
}

export function GlobalSearch({ tenantId }: GlobalSearchProps) {
  const [open, setOpen] = React.useState(false)
  const [members, setMembers] = React.useState<
    Array<{ id: string; firstName: string; lastName: string; email: string; company: { name: string; role: string } }>
  >([])
  const [drafts, setDrafts] = React.useState<Array<{ id: string; memberId: string; actionType: string; content: string }>>([])
  const router = useRouter()

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  React.useEffect(() => {
    if (!open) return
    void (async () => {
      const res = await fetch(`/app/api/search?tenantId=${encodeURIComponent(tenantId)}`, { cache: "no-store" })
      if (!res.ok) return
      const json = (await res.json()) as {
        members: typeof members
        drafts: typeof drafts
      }
      setMembers(json.members ?? [])
      setDrafts(json.drafts ?? [])
    })()
  }, [open, tenantId])

  return (
    <>
      <Button
        variant="outline"
        className="relative h-9 w-full justify-start text-sm text-muted-foreground sm:pr-12 md:w-40 lg:w-64 bg-transparent"
        onClick={() => setOpen(true)}
      >
        <Search className="mr-2 h-4 w-4" />
        <span className="hidden lg:inline-flex">Search...</span>
        <span className="lg:hidden">Search</span>
        <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-xs font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search members, drafts, companies..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Members">
            {members.slice(0, 5).map((member) => (
              <CommandItem
                key={member.id}
                value={`${member.firstName} ${member.lastName} ${member.company.name}`}
                onSelect={() => {
                  router.push(`/app/${tenantId}/members/${member.id}`)
                  setOpen(false)
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                    {member.firstName[0]}
                    {member.lastName[0]}
                  </div>
                  <div>
                    <div className="font-medium">
                      {member.firstName} {member.lastName}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {member.company.role} at {member.company.name}
                    </div>
                  </div>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Pending Drafts">
            {drafts
              .slice(0, 3)
              .map((draft) => {
                const member = members.find((m) => m.id === draft.memberId)
                return (
                  <CommandItem
                    key={draft.id}
                    value={`draft ${member?.firstName} ${member?.lastName} ${draft.actionType}`}
                    onSelect={() => {
                      router.push(`/app/${tenantId}/drafts`)
                      setOpen(false)
                    }}
                  >
                    <div>
                      <div className="font-medium">
                        {draft.actionType} for {member?.firstName} {member?.lastName}
                      </div>
                      <div className="text-xs text-muted-foreground truncate max-w-[300px]">
                        {draft.content.slice(0, 60)}...
                      </div>
                    </div>
                  </CommandItem>
                )
              })}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}
