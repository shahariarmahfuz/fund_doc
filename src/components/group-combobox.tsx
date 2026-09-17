"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Building2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export type ComboboxGroup = {
  id: string
  name: string
  code: string
  isFoundationGroup?: boolean
  memberSignupEnabled?: boolean
}

interface GroupComboboxProps {
  groups: ComboboxGroup[]
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  emptyText?: string
  disabled?: boolean
  className?: string
}

export function GroupCombobox({
  groups,
  value,
  onChange,
  placeholder = "Select group...",
  emptyText = "No group found",
  disabled = false,
  className,
}: GroupComboboxProps) {
  const [open, setOpen] = React.useState(false)

  const selectedGroup = groups.find((group) => group.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn("w-full justify-between font-normal", className)}
        >
          {selectedGroup ? (
            <div className="flex items-center gap-2 overflow-hidden text-left truncate">
              {selectedGroup.isFoundationGroup && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-primary/10 text-primary border-primary/20 shrink-0 flex items-center gap-1">
                  <Building2 className="w-2.5 h-2.5" />
                  <span>Central</span>
                </Badge>
              )}
              <span className="truncate">{selectedGroup.code} — {selectedGroup.name}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] sm:w-[380px] p-0" align="start">
        <Command filter={(value, search) => {
           if (!search) return 1
           const searchLower = search.toLowerCase()
           const group = groups.find(g => g.id === value)
           if (!group) return 0
           const searchableStr = `${group.code} ${group.name} ${group.isFoundationGroup ? 'foundation central' : ''}`.toLowerCase()
           return searchableStr.includes(searchLower) ? 1 : 0
        }}>
          <CommandInput placeholder="Search (name or code)..." />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {groups.map((group) => (
                <CommandItem
                  key={group.id}
                  value={group.id}
                  onSelect={(currentValue) => {
                    onChange(currentValue === value ? "" : currentValue)
                    setOpen(false)
                  }}
                  className="flex items-center justify-between p-2.5 cursor-pointer"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    {group.isFoundationGroup && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-primary/10 text-primary border-primary/20 shrink-0 flex items-center gap-1">
                        <Building2 className="w-2.5 h-2.5" />
                        <span>Central</span>
                      </Badge>
                    )}
                    <span className="font-medium text-sm truncate">
                      {group.code} — {group.name}
                    </span>
                  </div>
                  <Check
                    className={cn(
                      "h-4 w-4 shrink-0 text-primary ml-2",
                      value === group.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
