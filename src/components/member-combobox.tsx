"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
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
import { Badge } from "@/components/ui/badge"

export type ComboboxMember = {
  id: string
  memberId?: string | null
  beneficiaryId?: string | null
  fullName: string | null
  group?: { name?: string; code?: string } | null
  status?: string | null
}

interface MemberComboboxProps {
  members: ComboboxMember[]
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  emptyText?: string
  allowInactive?: boolean
}

export function MemberCombobox({
  members,
  value,
  onChange,
  placeholder,
  emptyText,
  allowInactive = false,
}: MemberComboboxProps) {
  const [open, setOpen] = React.useState(false)
  
  const effectivePlaceholder = placeholder || "Select member..."
  const effectiveEmptyText = emptyText || "No member found."

  // Filter selectable members unless allowInactive is true, or member is currently selected
  const availableMembers = React.useMemo(() => {
    if (allowInactive) return members
    return members.filter(
      (m) => m.id === value || (m.status !== "INACTIVE" && m.status !== "DELETED")
    )
  }, [members, value, allowInactive])

  const selectedMember = members.find((member) => member.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedMember ? (
            <div className="flex items-center gap-2 overflow-hidden text-left truncate">
              <span className="truncate">
                {selectedMember.memberId || selectedMember.beneficiaryId} — {selectedMember.fullName || "Unknown"}
              </span>
              {selectedMember.status === "INACTIVE" && (
                <Badge variant="outline" className="text-xs bg-rose-50 text-rose-600 border-rose-200">
                  Inactive
                </Badge>
              )}
            </div>
          ) : (
            <span className="text-muted-foreground">{effectivePlaceholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command
          filter={(val, search) => {
            if (!search) return 1
            const searchLower = search.toLowerCase()
            const member = availableMembers.find((m) => m.id === val)
            if (!member) return 0
            const searchableStr = `${member.memberId || member.beneficiaryId || ''} ${member.fullName || ''} ${member.group?.name || ''} ${member.group?.code || ''}`.toLowerCase()
            return searchableStr.includes(searchLower) ? 1 : 0
          }}
        >
          <CommandInput placeholder="Search by name, ID or group..." />
          <CommandList>
            <CommandEmpty>{effectiveEmptyText}</CommandEmpty>
            <CommandGroup>
              {availableMembers.map((member) => (
                <CommandItem
                  key={member.id}
                  value={member.id}
                  onSelect={(currentValue) => {
                    onChange(currentValue === value ? "" : currentValue)
                    setOpen(false)
                  }}
                  className="flex flex-col items-start p-2 cursor-pointer"
                >
                  <div className="flex w-full items-center justify-between">
                    <span className="font-medium flex items-center gap-1.5">
                      {member.memberId || member.beneficiaryId} — {member.fullName || "Unknown"}
                      {member.status === "INACTIVE" && (
                        <Badge variant="outline" className="text-[10px] bg-rose-50 text-rose-600 border-rose-200">
                          Inactive
                        </Badge>
                      )}
                    </span>
                    <Check
                      className={cn(
                        "h-4 w-4 shrink-0 text-primary",
                        value === member.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground mt-1">
                    {member.group ? `Group: ${member.group.name} (${member.group.code})` : ''}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
