"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Building2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { TenantId } from "@/lib/types"

const tenants = [
  { value: "b2b" as TenantId, label: "B2B CMO Club" },
  { value: "founders" as TenantId, label: "Founders Club" },
]

interface TenantSwitcherProps {
  value: TenantId
  onValueChange: (value: TenantId) => void
}

export function TenantSwitcher({ value, onValueChange }: TenantSwitcherProps) {
  const [open, setOpen] = React.useState(false)
  const currentTenant = tenants.find((t) => t.value === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[180px] justify-between bg-transparent"
        >
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span className="truncate">{currentTenant?.label ?? "Select tenant"}</span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[180px] p-0">
        <Command>
          <CommandInput placeholder="Search tenant..." />
          <CommandList>
            <CommandEmpty>No tenant found.</CommandEmpty>
            <CommandGroup>
              {tenants.map((tenant) => (
                <CommandItem
                  key={tenant.value}
                  value={tenant.value}
                  onSelect={() => {
                    onValueChange(tenant.value)
                    setOpen(false)
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === tenant.value ? "opacity-100" : "opacity-0")} />
                  {tenant.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
