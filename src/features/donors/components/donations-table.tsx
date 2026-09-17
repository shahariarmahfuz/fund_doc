"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
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
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, FileText, Download, Printer, Eye, Edit, Trash, Search, FilterX, Users, Building, UserCheck } from "lucide-react"
import { formatDate } from "@/lib/format"
import { toast } from "sonner"
import { deleteDonationTransaction, type DonationTransactionItem } from "../actions"
import { ViewDonationDialog } from "./view-donation-dialog"
import { EditDonationSheet } from "./edit-donation-sheet"
import { ReceiptDonationModal } from "./receipt-donation-modal"
import { useRbac } from "@/components/providers/rbac-provider"
import type { ComboboxMember } from "@/components/member-combobox"

interface DonationsTableProps {
  data: DonationTransactionItem[]
  donors: { id: string; fullName: string; donorId: string; mobile: string }[]
  members?: ComboboxMember[]
  groups: { id: string; name: string }[]
}

export function DonationsTable({ data, donors, members = [], groups }: DonationsTableProps) {
    const router = useRouter()
  const [sorting, setSorting] = useState<SortingState>([])
  const { can } = useRbac()

  const canView = can("Donors", "View")
  const canEdit = can("Donors", "Edit")
  const canDelete = can("Donors", "Delete")

  // Filter States
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSource, setSelectedSource] = useState("ALL")
  const [selectedDonor, setSelectedDonor] = useState("ALL")
  const [selectedGroup, setSelectedGroup] = useState("ALL")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")

  // Modal / Sheet Active Items
  const [viewingItem, setViewingItem] = useState<DonationTransactionItem | null>(null)
  const [editingItem, setEditingItem] = useState<DonationTransactionItem | null>(null)
  const [receiptItem, setReceiptItem] = useState<{ item: DonationTransactionItem; mode: "print" | "pdf" } | null>(null)

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this donation transaction?\n\nIt will be permanently deleted and automatically reverse the donor ledger, group ledger, group total fund, and dashboard calculations.")) {
      const res = await deleteDonationTransaction(id)
      if (res.success) {
        toast.success("Deleted successfully", { description: "Transaction and all related ledger entries have been automatically reversed." })
      } else {
        toast.error("Unable to delete", { description: (res as any).error })
      }
    }
  }

  const filteredData = useMemo(() => {
    return data.filter((row) => {
      // 1. Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const voucherNo = row.voucherNo.toLowerCase()
        const donorName = (row.donor?.fullName || "").toLowerCase()
        const donorId = (row.donor?.donorId || "").toLowerCase()
        const donorMobile = (row.donor?.mobile || "").toLowerCase()
        const memberName = (row.member?.fullName || "").toLowerCase()
        const memberId = (row.member?.memberId || "").toLowerCase()
        const groupName = (row.groupName || "").toLowerCase()
        const remarks = (row.remarks || "").toLowerCase()
        const creator = (row.createdBy || "").toLowerCase()

        if (!voucherNo.includes(q) && 
            !donorName.includes(q) && 
            !donorId.includes(q) &&
            !donorMobile.includes(q) && 
            !memberName.includes(q) &&
            !memberId.includes(q) &&
            !groupName.includes(q) && 
            !remarks.includes(q) && 
            !creator.includes(q)) {
          return false
        }
      }

      // 2. Source filter
      if (selectedSource !== "ALL" && row.sourceType !== selectedSource) {
        return false
      }

      // 3. Donor filter
      if (selectedDonor !== "ALL" && row.donorId !== selectedDonor && row.memberId !== selectedDonor) {
        return false
      }

      // 4. Group filter
      if (selectedGroup !== "ALL" && row.groupId !== selectedGroup) {
        return false
      }

      // 5. Date Range filter
      if (fromDate) {
        const rowDate = new Date(row.date).setHours(0, 0, 0, 0)
        const filterFrom = new Date(fromDate).setHours(0, 0, 0, 0)
        if (rowDate < filterFrom) return false
      }
      if (toDate) {
        const rowDate = new Date(row.date).setHours(23, 59, 59, 999)
        const filterTo = new Date(toDate).setHours(23, 59, 59, 999)
        if (rowDate > filterTo) return false
      }

      return true
    })
  }, [data, searchQuery, selectedSource, selectedDonor, selectedGroup, fromDate, toDate])

  const handleResetFilters = () => {
    setSearchQuery("")
    setSelectedSource("ALL")
    setSelectedDonor("ALL")
    setSelectedGroup("ALL")
    setFromDate("")
    setToDate("")
  }

  const columns: ColumnDef<DonationTransactionItem>[] = [
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => (
        <div>
          <div className="font-medium text-sm">{formatDate(row.getValue("date"))}</div>
          <div className="text-xs text-muted-foreground">
            {new Date(row.getValue("date") as string).toLocaleDateString("bn-BD")}
          </div>
        </div>
      ),
    },
    {
      id: "voucherNo",
      accessorKey: "voucherNo",
      header: "Voucher No",
      cell: ({ row }) => (
        <span className="font-mono text-xs bg-primary/10 border border-primary/20 px-2 py-1 rounded font-bold text-primary">
          {row.getValue("voucherNo")}
        </span>
      ),
    },
    {
      id: "sourceType",
      header: "Source",
      cell: ({ row }) => {
        const isMember = row.original.sourceType === "MEMBER"
        return isMember ? (
          <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-normal flex items-center gap-1 w-fit">
            <UserCheck className="w-3 h-3" />
            <span>{"Foundation Member"}</span>
          </Badge>
        ) : (
          <Badge variant="outline" className="border-primary text-primary text-[11px] font-normal flex items-center gap-1 w-fit">
            <Users className="w-3 h-3" />
            <span>{"Non-member / Donor"}</span>
          </Badge>
        )
      }
    },
    {
      id: "donorName",
      header: "Donated By",
      cell: ({ row }) => {
        const isMember = row.original.sourceType === "MEMBER"
        const donor = row.original.donor
        const member = row.original.member
        return (
          <div>
            {isMember ? (
              <>
                <div className="font-semibold text-foreground">{member?.fullName || "Foundation Member"}</div>
                <div className="text-xs text-muted-foreground">
                  {"ID:"}{member?.memberId || row.original.memberId}
                </div>
              </>
            ) : (
              <>
                <div className="font-semibold text-foreground">{donor?.fullName || "External Donor"}</div>
                {donor && (
                  <div className="text-xs text-muted-foreground">
                    {"ID:"}{donor.donorId} | {donor.mobile}
                  </div>
                )}
              </>
            )}
          </div>
        )
      },
    },
    {
      id: "selectedGroup",
      header: "Selected Group",
      cell: ({ row }) => (
        <div className="font-medium text-foreground bg-muted px-2.5 py-1 rounded w-fit text-xs border">
          {row.original.groupName}
        </div>
      ),
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => (
        <span className="font-bold text-green-600 font-mono text-base">
          ৳{row.getValue("amount")}
        </span>
      ),
    },
    {
      accessorKey: "remarks",
      header: "Remarks",
      cell: ({ row }) => (
        <div className="max-w-[180px] truncate text-muted-foreground text-sm" title={row.getValue("remarks") as string || ""}>
          {row.getValue("remarks") || "-"}
        </div>
      ),
    },
    {
      accessorKey: "createdBy",
      header: "Created By",
      cell: ({ row }) => (
        <span className="text-xs font-medium text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded">
          {row.getValue("createdBy") || "Admin"}
        </span>
      ),
    },
    {
      id: "actions",
      enableHiding: false,
      header: () => {
        return (<div className="text-right">{"action"}</div>);
      },
      cell: ({ row }) => {
        const item = row.original
        const isMember = item.sourceType === "MEMBER"
        return (
          <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-muted">
                  <span className="sr-only">{"Open menu"}</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>{"actions"}</DropdownMenuLabel>
                <DropdownMenuSeparator />

                {canView && (
                  <DropdownMenuItem onClick={() => setViewingItem(item)} className="cursor-pointer">
                    <Eye className="mr-2 h-4 w-4 text-blue-500" /> {"View"}</DropdownMenuItem>
                )}

                {canEdit && (
                  <DropdownMenuItem onClick={() => setEditingItem(item)} className="cursor-pointer">
                    <Edit className="mr-2 h-4 w-4 text-amber-500" /> {"Edit"}</DropdownMenuItem>
                )}

                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={() => setReceiptItem({ item, mode: "print" })} className="cursor-pointer">
                  <Printer className="mr-2 h-4 w-4 text-emerald-500" /> {"Print Receipt"}</DropdownMenuItem>

                <DropdownMenuItem onClick={() => setReceiptItem({ item, mode: "pdf" })} className="cursor-pointer">
                  <Download className="mr-2 h-4 w-4 text-purple-500" /> {"Export PDF"}</DropdownMenuItem>

                {canView && (
                  <>
                    <DropdownMenuSeparator />

                    {isMember ? (
                      <DropdownMenuItem
                        onClick={() => {
                          if (item.memberId) {
                            router.push(`/members/${item.memberId}`)
                          } else {
                            toast.error("Member details not found")
                          }
                        }}
                        className="cursor-pointer"
                      >
                        <UserCheck className="mr-2 h-4 w-4 text-emerald-500" /> View Member Profile</DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem
                        onClick={() => {
                          if (item.donorId) {
                            router.push(`/donors/ledger?donorId=${item.donorId}`)
                            toast.info("Donor ledger has been opened", { description: `Donor: ${item.donor?.fullName || item.donorId}` })
                          } else {
                            toast.error("Donor not found")
                          }
                        }}
                        className="cursor-pointer"
                      >
                        <Users className="mr-2 h-4 w-4 text-sky-500" /> {"Open Donor Ledger"}</DropdownMenuItem>
                    )}

                    <DropdownMenuItem
                      onClick={() => {
                        if (item.groupId) {
                          router.push(`/groups/${item.groupId}/ledger`)
                          toast.info("Group ledger is opened", { description: `Group: ${item.groupName}` })
                        } else {
                          router.push("/groups/fund")
                        }
                      }}
                      className="cursor-pointer"
                    >
                      <Building className="mr-2 h-4 w-4 text-indigo-500" /> {"Open the group ledger"}</DropdownMenuItem>
                  </>
                )}

                {canDelete && (
                  <>
                    <DropdownMenuSeparator />

                    <DropdownMenuItem onClick={() => handleDelete(item.id)} className="cursor-pointer text-destructive focus:text-destructive">
                      <Trash className="mr-2 h-4 w-4" /> {"Delete"}</DropdownMenuItem>
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
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
  })

  const hasActiveFilters = searchQuery !== "" || selectedSource !== "ALL" || selectedDonor !== "ALL" || selectedGroup !== "ALL" || fromDate !== "" || toDate !== ""

  return (
    <div className="space-y-4">
      {/* Filters Card */}
      <div className="p-4 rounded-xl bg-card border shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Search className="h-4 w-4 text-primary" />
            {"Filter Donations"}</h3>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={handleResetFilters} className="h-8 px-2 text-xs text-muted-foreground hover:text-destructive">
              <FilterX className="h-3.5 w-3.5 mr-1" /> {"Reset filter"}</Button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Search Input */}
          <div className="space-y-1 col-span-1 sm:col-span-2 md:col-span-1">
            <label className="text-xs font-medium text-muted-foreground">{"Search"}</label>
            <Input
              placeholder={"Voucher, Name, Mobile or Details..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 text-sm"
            />
          </div>

          {/* Source Filter */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">{"Donation Source *"}</label>
            <Select value={selectedSource} onValueChange={setSelectedSource}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="All Sources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Sources</SelectItem>
                <SelectItem value="MEMBER">{"Foundation Member"}</SelectItem>
                <SelectItem value="DONOR">{"Non-member / Donor"}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Donor/Member Filter */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">{"Donor"}</label>
            <Select value={selectedDonor} onValueChange={setSelectedDonor}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder={"All donors"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{"All Donors"}</SelectItem>
                {donors.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.fullName} ({d.donorId})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Group Filter */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">{"Selected Group"}</label>
            <Select value={selectedGroup} onValueChange={setSelectedGroup}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder={"All groups"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{"All Groups"}</SelectItem>
                {groups.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* From Date */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">{"From Date"}</label>
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="h-9 text-sm"
            />
          </div>

          {/* To Date */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">{"To Date"}</label>
            <Input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="h-9 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            {table.getHeaderGroups().map((headerGroup) => {
              return ((
                          <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => {
                              return (
                                <TableHead key={header.id} className="py-3.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                </TableHead>
                              )
                            })}
                          </TableRow>
                        ));
            })}
          </TableHeader>
          <TableBody className="divide-y">
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => {
                return ((
                              <TableRow key={row.id} data-state={row.getIsSelected() && "selected"} className="hover:bg-muted/30 transition-colors">
                                {row.getVisibleCells().map((cell) => (
                                  <TableCell key={cell.id} className="py-3">
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                  </TableCell>
                                ))}
                              </TableRow>
                            ));
              })
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-36 text-center">
                  <div className="flex flex-col items-center justify-center space-y-2 text-muted-foreground">
                    <FileText className="h-8 w-8 text-muted-foreground/40" />
                    <p className="font-medium text-base">{"No donation transactions found"}</p>
                    <p className="text-xs text-muted-foreground">
                      {hasActiveFilters ? "Try changing the filters to see results" : "Create a new donation entry from the Receive Donation menu."}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {table.getPageCount() > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t bg-muted/20">
            <div className="text-xs text-muted-foreground">
              {"total"}<span className="font-bold text-foreground">{filteredData.length}</span> {"t transaction displayed"}</div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="h-8 px-3 text-xs"
              >
                {"Prev"}</Button>
              <span className="text-xs font-medium px-2">
                {"page"}{table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="h-8 px-3 text-xs"
              >
                {"Next"}</Button>
            </div>
          </div>
        )}
      </div>

      {/* Modals & Sheets */}
      <ViewDonationDialog
        isOpen={!!viewingItem}
        onClose={() => setViewingItem(null)}
        donation={viewingItem}
      />

      <EditDonationSheet
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        donation={editingItem}
        donors={donors}
        members={members}
        groups={groups}
      />

      <ReceiptDonationModal
        isOpen={!!receiptItem}
        onClose={() => setReceiptItem(null)}
        donation={receiptItem?.item || null}
        mode={receiptItem?.mode}
      />
    </div>
  )
}
