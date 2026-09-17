"use client"
import { formatDate, formatCurrency } from "@/lib/format"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  getFilteredRowModel,
  ColumnFiltersState,
} from "@tanstack/react-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Group } from "@/types/models"
import { GroupFormDialog } from "./group-form-dialog"

import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Eye, Edit, Trash2, MoreHorizontal, ArrowUpDown, Building2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { archiveGroup, deleteGroup, updateGroup } from "../actions"
import type { GroupWithCount } from "../types"
import { useRbac } from "@/components/providers/rbac-provider"
import { isSuperAdminRole } from "@/lib/rbac-client"

export function GroupsTable({ data, manageMode = false }: { data: GroupWithCount[], manageMode?: boolean }) {
  const router = useRouter()
  const { data: session } = useSession()
  const isSuperAdmin = isSuperAdminRole((session?.user as any)?.role)

  const [tableData, setTableData] = useState<GroupWithCount[]>(data)
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [groupToDelete, setGroupToDelete] = useState<GroupWithCount | null>(null)
  const [confirmInput, setConfirmInput] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    setTableData(data)
  }, [data])

  const { can } = useRbac()
  const canView = can("Groups", "View")
  const canEdit = can("Groups", "Edit")
  const canDelete = can("Groups", "Delete")


  const columns: ColumnDef<GroupWithCount>[] = [
    {
      accessorKey: "code",
      header: ({ column }) => {
        return (
          <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="-ml-4">
            {"Code"}<ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
    },
    {
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="-ml-4">
            {"Name"}<ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="font-semibold text-foreground">{row.getValue("name")}</span>
          {row.original.isFoundationGroup && (
            <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] py-0 px-2 flex items-center gap-1">
              <Building2 className="w-3 h-3" />
              <span>Foundation Central Fund</span>
            </Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: "_count.members",
      header: ({ column }) => {
        return (
          <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="-ml-4">
            {"Members"}<ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
    },
    {
      id: "currentFund",
      header: "Current Fund",
      cell: ({ row }) => `৳${formatCurrency(row.original.currentFund || 0)}`,
    },
    {
      accessorKey: "memberSignupEnabled",
      header: "Member Signup",
      cell: ({ row }) => (
        row.original.memberSignupEnabled ? (
          <Badge variant="outline" className="border-emerald-500 text-emerald-600 text-[11px]">Allowed</Badge>
        ) : (
          <Badge variant="secondary" className="text-muted-foreground text-[11px]">Disabled</Badge>
        )
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.getValue("status") === "ACTIVE" ? "default" : "secondary"}>
          {row.getValue("status") === "ACTIVE" ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => {
        return (
          <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="-ml-4">
            {"Created"}<ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => formatDate(row.getValue("createdAt")),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const group = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">{"Actions"}</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{"Actions"}</DropdownMenuLabel>
              {canView && (
                <DropdownMenuItem asChild>
                  <Link href={`/groups/${group.id}`}>
                    <Eye className="mr-2 h-4 w-4" /> {"View"}</Link>
                </DropdownMenuItem>
              )}
              {manageMode && (
                <>
                  {canEdit && (
                    <>
                      <GroupFormDialog
                        group={group}
                        trigger={
                          <DropdownMenuItem onSelect={(e) => {
                              return (e.preventDefault());
                            }}>
                            <Edit className="mr-2 h-4 w-4" /> {"Edit"}</DropdownMenuItem>
                        }
                      />
                      {group.status === "INACTIVE" ? (
                        <DropdownMenuItem
                          onClick={async () => {
                            const payload = {
                              name: group.name,
                              code: group.code,
                              shortName: group.shortName || "",
                              description: group.description || "",
                              status: "ACTIVE" as const,
                              openingBalance: 0,
                              remarks: group.remarks || "",
                              memberSignupEnabled: group.memberSignupEnabled ?? true,
                              isFoundationGroup: group.isFoundationGroup ?? false,
                            }
                            const res = await updateGroup(group.id, payload)
                            if (res.success) toast.success("Group activated successfully")
                            else toast.error(res.error)
                          }}
                        >
                          <Eye className="mr-2 h-4 w-4" /> {"Activate"}</DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          onClick={async () => {
                            const payload = {
                              name: group.name,
                              code: group.code,
                              shortName: group.shortName || "",
                              description: group.description || "",
                              status: "INACTIVE" as const,
                              openingBalance: 0,
                              remarks: group.remarks || "",
                              memberSignupEnabled: group.memberSignupEnabled ?? true,
                              isFoundationGroup: group.isFoundationGroup ?? false,
                            }
                            const res = await updateGroup(group.id, payload)
                            if (res.success) toast.success("Group deactivated successfully")
                            else toast.error(res.error)
                          }}
                        >
                          <Eye className="mr-2 h-4 w-4" /> {"Deactivate"}</DropdownMenuItem>
                      )}
                    </>
                  )}
                  {/* Super Admin True Hard Delete */}
                  {isSuperAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive focus:bg-destructive/10 font-medium cursor-pointer"
                        onSelect={() => {
                          setGroupToDelete(group)
                          setConfirmInput("")
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4 text-destructive" /> {"Delete Permanently"}
                      </DropdownMenuItem>
                    </>
                  )}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const handleDeleteConfirm = async () => {
    if (!groupToDelete) return
    const expectedCode = groupToDelete.code?.trim()
    const expectedId = groupToDelete.id?.trim()
    const entered = confirmInput.trim()

    if (entered !== expectedCode && entered !== expectedId) {
      toast.error(`Please type "${expectedCode}" exactly to confirm deletion.`)
      return
    }

    setIsDeleting(true)
    try {
      const res = await deleteGroup(groupToDelete.id)
      if (res.success) {
        toast.success("✓ Group deleted permanently")
        const deletedId = groupToDelete.id
        setTableData((prev) => prev.filter((g) => g.id !== deletedId))
        setGroupToDelete(null)
        setConfirmInput("")
        router.refresh()
      } else {
        toast.error(res.error || "Failed to permanently delete group.")
      }
    } catch (err: any) {
      toast.error(err?.message || "An unexpected error occurred.")
    } finally {
      setIsDeleting(false)
    }
  }

  const table = useReactTable({
    data: tableData,
    columns,

    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
  })

  return (
    <div>
      <div className="flex items-center py-2">
        <Input
          placeholder={"Search groups..."}
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("name")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
      </div>
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => {
              return ((
                          <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => {
                              return (
                                <TableHead key={header.id}>
                                  {header.isPlaceholder
                                    ? null
                                    : flexRender(
                                        header.column.columnDef.header,
                                        header.getContext()
                                      )}
                                </TableHead>
                              )
                            })}
                          </TableRow>
                        ));
            })}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => {
                return ((
                              <TableRow
                                key={row.id}
                                data-state={row.getIsSelected() && "selected"}
                              >
                                {row.getVisibleCells().map((cell) => (
                                  <TableCell key={cell.id}>
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                  </TableCell>
                                ))}
                              </TableRow>
                            ));
              })
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {"No groups found."}</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          {"Previous"}</Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          {"Next"}</Button>
      </div>

      {/* Super Admin True Hard Delete Confirmation Dialog */}
      <Dialog
        open={!!groupToDelete}
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            setGroupToDelete(null)
            setConfirmInput("")
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-destructive flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Delete Group?
            </DialogTitle>
            <DialogDescription className="pt-2 text-sm text-muted-foreground leading-relaxed">
              This action permanently deletes the group and all Group-owned records associated with it. This cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-3">
            <p className="text-sm font-medium text-foreground">
              Type <span className="font-mono font-bold text-destructive select-all bg-destructive/10 px-1.5 py-0.5 rounded border border-destructive/20">{groupToDelete?.code}</span> to permanently delete this group.
            </p>
            <Input
              placeholder={`Type ${groupToDelete?.code || "Group ID"}`}
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              disabled={isDeleting}
              className="font-mono"
              autoFocus
              onKeyDown={(e) => {
                if (
                  e.key === "Enter" &&
                  groupToDelete &&
                  (confirmInput.trim() === groupToDelete.code?.trim() || confirmInput.trim() === groupToDelete.id?.trim()) &&
                  !isDeleting
                ) {
                  handleDeleteConfirm()
                }
              }}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setGroupToDelete(null)
                setConfirmInput("")
              }}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={
                isDeleting ||
                !groupToDelete ||
                (confirmInput.trim() !== groupToDelete.code?.trim() && confirmInput.trim() !== groupToDelete.id?.trim())
              }
              onClick={handleDeleteConfirm}
              className="font-semibold shadow-sm"
            >
              {isDeleting ? "Deleting Permanently..." : "Delete Permanently"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

