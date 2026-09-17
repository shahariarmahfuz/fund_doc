"use client"

import { formatDate } from "@/lib/format"
import { useState, useEffect } from "react"
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
import type { Member, Group } from "@/types/models"
import { toggleMemberStatus, deleteMember, restoreMember } from "../actions"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import {
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  Power,
  PowerOff,
  BookOpen,
  AlertTriangle,
  RotateCcw,
  Download
} from "lucide-react"
import { useRbac } from "@/components/providers/rbac-provider"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

type MemberWithGroup = Member & {
  group: { name: string; code: string } | null
}

export function MembersTable({ data, groups, isManage = false }: { data: MemberWithGroup[], groups: Group[], isManage?: boolean }) {
      const [tableData, setTableData] = useState<MemberWithGroup[]>(data)
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  // Keep tableData updated when prop changes
  useEffect(() => {
    setTableData(data)
  }, [data])

  // Confirmation modal states
  const [statusConfirmMember, setStatusConfirmMember] = useState<MemberWithGroup | null>(null)
  const [deleteConfirmMember, setDeleteConfirmMember] = useState<MemberWithGroup | null>(null)
  const [restoreConfirmMember, setRestoreConfirmMember] = useState<MemberWithGroup | null>(null)

  // Reason form state
  const [selectedReason, setSelectedReason] = useState<string>("Temporary inactive")
  const [customNote, setCustomNote] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { can, permissions } = useRbac()
  const isSuperAdmin = permissions.includes("*")
  const canView = can("Members", "View")
  const canEdit = can("Members", "Edit")
  const canDelete = can("Members", "Delete")
  const canViewLedger = can("Reports", "View") || canView

  const handleConfirmStatusToggle = async () => {
    if (!statusConfirmMember) return
    const memberId = statusConfirmMember.id
    const currentStatus = statusConfirmMember.status
    const targetStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE"

    const reasonText = currentStatus === "ACTIVE"
      ? (selectedReason === "Other" ? (customNote || "Other") : selectedReason)
      : (customNote || "Member Reactivated");

    setIsSubmitting(true)

    // Optimistic Update: Update badge instantly
    setTableData(prev =>
      prev.map(m => (m.id === memberId ? { ...m, status: targetStatus } : m))
    )

    const res = await toggleMemberStatus(memberId, targetStatus, reasonText, customNote)
    setIsSubmitting(false)
    setStatusConfirmMember(null)
    setCustomNote("")

    if (res.success) {
      toast.success(
        targetStatus === "ACTIVE"
          ? "Member activated successfully"
          : "Member deactivated successfully"
      )
    } else {
      // Revert state if failed
      setTableData(prev =>
        prev.map(m => (m.id === memberId ? { ...m, status: currentStatus } : m))
      )
      toast.error(res.error || "Failed to change member status")
    }
  }

  const handleConfirmDelete = async () => {
    if (!deleteConfirmMember) return
    const memberId = deleteConfirmMember.id
    const backupMember = deleteConfirmMember

    setIsSubmitting(true)

    // Optimistic Update: Mark as DELETED or remove if filtered
    setTableData(prev => prev.filter(m => m.id !== memberId))

    const res = await deleteMember(memberId)
    setIsSubmitting(false)
    setDeleteConfirmMember(null)

    if (res.success) {
      toast.success("Member deleted successfully")
    } else {
      // Revert if error
      setTableData(prev => [backupMember, ...prev])
      toast.error(res.error || "Failed to delete member")
    }
  }

  const handleConfirmRestore = async () => {
    if (!restoreConfirmMember) return
    const memberId = restoreConfirmMember.id

    setIsSubmitting(true)

    setTableData(prev =>
      prev.map(m => (m.id === memberId ? { ...m, status: "ACTIVE" } : m))
    )

    const res = await restoreMember(memberId, customNote || "Restored by Super Admin")
    setIsSubmitting(false)
    setRestoreConfirmMember(null)
    setCustomNote("")

    if (res.success) {
      toast.success("Member restored successfully")
    } else {
      toast.error(res.error || "Failed to restore member")
    }
  }

  const columns: ColumnDef<MemberWithGroup>[] = [
    {
      accessorKey: "memberId",
      header: "Member ID",
    },
    {
      accessorKey: "fullName",
      header: "Name",
      cell: ({ row }) => `${row.original.fullName || ''}`
    },
    {
      accessorKey: "groupId",
      header: "Group",
      cell: ({ row }) => row.original.group ? `${row.original.group.name} (${row.original.group.code})` : "None",
    },
    {
      accessorKey: "mobile",
      header: "Mobile",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status
        if (status === "ACTIVE") {
          return (
            <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1 font-normal">
              <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse"></span>
              {"ACTIVE"}</Badge>
          )
        }
        if (status === "INACTIVE") {
          return (
            <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 gap-1 font-normal">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span>
              {"INACTIVE"}</Badge>
          )
        }
        return <Badge variant="destructive">{status}</Badge>
      },
    },
    {
      accessorKey: "joinDate",
      header: "Join Date",
      cell: ({ row }) => row.original.joinDate ? formatDate(row.original.joinDate) : 'N/A',
    },
    {
      id: "actions",
      header: () => {
        return (<div className="text-right">{"Actions"}</div>);
      },
      cell: ({ row }) => {
        const member = row.original

        const showView = canView
        const showEdit = canEdit && member.status !== "DELETED"
        const showLedger = canViewLedger
        const showStatusToggle = canEdit && member.status !== "DELETED"
        const showDelete = canDelete && member.status !== "DELETED"
        const showRestore = isSuperAdmin && member.status === "DELETED"

        const hasAnyAction = showView || showEdit || showLedger || showStatusToggle || showDelete || showRestore

        if (!hasAnyAction) return null

        return (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-muted">
                  <span className="sr-only">{"Open menu"}</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground">
                  {"Actions"}</DropdownMenuLabel>
                <DropdownMenuSeparator />

                {/* 1. View Details */}
                {showView && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href={`/members/${member.id}`} className="cursor-pointer flex items-center">
                        <Eye className="mr-2 h-4 w-4 text-blue-500" />
                        <span>{"View Profile"}</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/api/members/${member.id}/registration-form`} target="_blank" className="cursor-pointer flex items-center">
                        <Download className="mr-2 h-4 w-4 text-purple-500" />
                        <span>{"Download Registration Form"}</span>
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}

                {/* 2. Edit Member */}
                {showEdit && (
                  <DropdownMenuItem asChild>
                    <Link href={`/members/${member.id}/edit`} className="cursor-pointer flex items-center">
                      <Edit className="mr-2 h-4 w-4 text-amber-500" />
                      <span>{"Edit Member"}</span>
                    </Link>
                  </DropdownMenuItem>
                )}

                {/* 3. Member Ledger */}
                {showLedger && (
                  <DropdownMenuItem asChild>
                    <Link href={`/members/ledger?memberId=${member.id}`} className="cursor-pointer flex items-center">
                      <BookOpen className="mr-2 h-4 w-4 text-emerald-500" />
                      <span>{"Ledger"}</span>
                    </Link>
                  </DropdownMenuItem>
                )}

                {/* 4. Active / Deactivate */}
                {showStatusToggle && (
                  <>
                    <DropdownMenuSeparator />
                    {member.status === "ACTIVE" ? (
                      <DropdownMenuItem
                        className="cursor-pointer text-amber-600 focus:text-amber-600"
                        onClick={() => {
                          setSelectedReason("Temporary inactive")
                          setStatusConfirmMember(member)
                        }}
                      >
                        <PowerOff className="mr-2 h-4 w-4 text-amber-500" />
                        <span>{"Deactivate"}</span>
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem
                        className="cursor-pointer text-emerald-600 focus:text-emerald-600"
                        onClick={() => {
                          setSelectedReason("")
                          setStatusConfirmMember(member)
                        }}
                      >
                        <Power className="mr-2 h-4 w-4 text-emerald-500" />
                        <span>{"Activate"}</span>
                      </DropdownMenuItem>
                    )}
                  </>
                )}

                {/* Restore for Super Admin */}
                {showRestore && (
                  <DropdownMenuItem
                    className="cursor-pointer text-emerald-600 focus:text-emerald-600"
                    onClick={() => setRestoreConfirmMember(member)}
                  >
                    <RotateCcw className="mr-2 h-4 w-4 text-emerald-500" />
                    <span>{"Restore"}</span>
                  </DropdownMenuItem>
                )}

                {/* 5. Delete Member */}
                {showDelete && (
                  <>
                    {!showStatusToggle && <DropdownMenuSeparator />}
                    <DropdownMenuItem
                      className="cursor-pointer text-destructive focus:text-destructive"
                      onClick={() => setDeleteConfirmMember(member)}
                    >
                      <Trash2 className="mr-2 h-4 w-4 text-destructive" />
                      <span>{"Delete"}</span>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
    },
  ]

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
      <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 space-x-0 sm:space-x-2 py-2">
        <Input
          placeholder={"Search by name..."}
          value={(table.getColumn("fullName")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("fullName")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        
        {/* Status Filter */}
        <Select 
          value={(table.getColumn("status")?.getFilterValue() as string) ?? "ALL"}
          onValueChange={(value) => {
            if (value === "ALL") table.getColumn("status")?.setFilterValue("")
            else table.getColumn("status")?.setFilterValue(value)
          }}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder={"Status"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{"All Status"}</SelectItem>
            <SelectItem value="ACTIVE">{"Active"}</SelectItem>
            <SelectItem value="INACTIVE">{"Inactive"}</SelectItem>
            {isSuperAdmin && <SelectItem value="DELETED">{"Deleted"}</SelectItem>}
          </SelectContent>
        </Select>

        {/* Group Filter */}
        <Select 
          value={(table.getColumn("groupId")?.getFilterValue() as string) ?? "ALL"}
          onValueChange={(value) => {
            if (value === "ALL") table.getColumn("groupId")?.setFilterValue("")
            else table.getColumn("groupId")?.setFilterValue(value)
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={"Group"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{"All Groups"}</SelectItem>
            {groups.map(g => (
              <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
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
                  {"No results found."}</TableCell>
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

      {/* Confirmation Dialog: Status Toggle (Deactivate / Activate) */}
      <Dialog open={!!statusConfirmMember} onOpenChange={(open) => !open && setStatusConfirmMember(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {statusConfirmMember?.status === "ACTIVE" ? (
                <>
                  <PowerOff className="h-5 w-5 text-amber-500" />
                  <span>{"Deactivate Member"}</span>
                </>
              ) : (
                <>
                  <Power className="h-5 w-5 text-emerald-500" />
                  <span>{"Activate Member"}</span>
                </>
              )}
            </DialogTitle>
            <DialogDescription className="py-2 text-sm text-muted-foreground leading-relaxed">
              {statusConfirmMember?.status === "ACTIVE" ? (
                <>
                  {"Are you sure you want to change the status of "}<strong>{statusConfirmMember?.fullName}</strong> ({statusConfirmMember?.memberId}{") to "}<strong>{"Inactive"}</strong> {"?"}<br className="my-1" />
                  {"They will no longer be able to log in or receive notifications."}</>
              ) : (
                <>
                  {"Are you sure you want to change the status of "}<strong>{statusConfirmMember?.fullName}</strong> ({statusConfirmMember?.memberId}{") to "}<strong>{"Active"}</strong> {"?"}<br className="my-1" />
                  {"They will regain access to the platform."}</>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            {statusConfirmMember?.status === "ACTIVE" ? (
              <div className="space-y-1.5">
                <Label htmlFor="deactivate-reason">{"Reason for deactivation"}</Label>
                <Select value={selectedReason} onValueChange={setSelectedReason}>
                  <SelectTrigger id="deactivate-reason">
                    <SelectValue placeholder={"Select reason"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Left the foundation">{"Left the foundation"}</SelectItem>
                    <SelectItem value="Transferred">{"Transferred"}</SelectItem>
                    <SelectItem value="Deceased">{"Deceased"}</SelectItem>
                    <SelectItem value="Temporary inactive">{"Temporary inactive"}</SelectItem>
                    <SelectItem value="Other">{"Other"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            {(selectedReason === "Other" || statusConfirmMember?.status !== "ACTIVE") && (
              <div className="space-y-1.5">
                <Label htmlFor="custom-reason">{"Custom Note (Optional)"}</Label>
                <Input
                  id="custom-reason"
                  placeholder={"Enter details..."}
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                />
              </div>
            )}
          </div>

          <DialogFooter className="flex gap-2 sm:justify-end mt-2">
            <Button variant="outline" onClick={() => setStatusConfirmMember(null)} disabled={isSubmitting}>
              {"Cancel"}</Button>
            <Button
              variant={statusConfirmMember?.status === "ACTIVE" ? "destructive" : "default"}
              onClick={handleConfirmStatusToggle}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Processing..." : statusConfirmMember?.status === "ACTIVE" ? "Deactivate" : "Activate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog: Soft Delete */}
      <Dialog open={!!deleteConfirmMember} onOpenChange={(open) => !open && setDeleteConfirmMember(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <span>{"Delete Member"}</span>
            </DialogTitle>
            <DialogDescription className="space-y-3 py-2 text-sm text-muted-foreground leading-relaxed">
              <p>
                {"Are you sure you want to delete "}<strong>{deleteConfirmMember?.fullName}</strong> ({deleteConfirmMember?.memberId}{"?"}</p>
              <div className="rounded-md bg-amber-500/10 p-3 text-amber-800 text-xs border border-amber-500/20">
                ⚠️ <strong>{"Warning:"}</strong> {"This action will soft-delete the member. They will no longer appear in normal views."}</div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:justify-end mt-2">
            <Button variant="outline" onClick={() => setDeleteConfirmMember(null)} disabled={isSubmitting}>
              {"Cancel"}</Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Processing..." : "Yes, Soft Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog: Restore */}
      <Dialog open={!!restoreConfirmMember} onOpenChange={(open) => !open && setRestoreConfirmMember(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-600">
              <RotateCcw className="h-5 w-5" />
              <span>{"Restore Member"}</span>
            </DialogTitle>
            <DialogDescription className="py-2 text-sm text-muted-foreground leading-relaxed">
              {"Are you sure you want to restore "}<strong>{restoreConfirmMember?.fullName}</strong>{"?"}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:justify-end mt-2">
            <Button variant="outline" onClick={() => setRestoreConfirmMember(null)} disabled={isSubmitting}>
              {"Cancel"}</Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleConfirmRestore}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Processing..." : "Restore"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
