"use client"
import { formatCurrency, formatDate } from "@/lib/format"
import { useState, useMemo } from "react"
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
  FilterFn
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
import { ArrowUpDown, Edit, Eye, Trash, MoreHorizontal, Printer, Archive, Search, FilterX, BookOpen } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import type { Grant, FundAllocation, Fund } from "@/types/models"
import { deleteGrant } from "../actions"
import { toast } from "sonner"
import Link from "next/link"
import { useRbac } from "@/components/providers/rbac-provider"

type GrantWithDetails = Grant & {
  beneficiary: {
    fullName: string | null
    beneficiaryId: string
    phone?: string | null
  }
  allocations: (FundAllocation & {
    fund: Fund & {
      group: { name: string; code: string } | null
    }
  })[]
}

const globalSearchFn: FilterFn<any> = (row, columnId, value, addMeta) => {
  const searchValue = value.toLowerCase()
  const grantNo = (row.original.grantNumber || "").toLowerCase()
  const beneficiaryName = (row.original.beneficiary?.fullName || "").toLowerCase()
  const phone = (row.original.beneficiary?.phone || "").toLowerCase()
  return grantNo.includes(searchValue) || beneficiaryName.includes(searchValue) || phone.includes(searchValue)
}

export function GrantsTable({ data, manageMode = false }: { data: GrantWithDetails[], manageMode?: boolean }) {
    const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState("")
  const [amountRange, setAmountRange] = useState({ min: "", max: "" })
  const { can } = useRbac()

  const canView = can("Grants", "View")
  const canEdit = can("Grants", "Edit")
  const canDelete = can("Grants", "Delete")

  const filteredData = useMemo(() => {
    return data.filter(item => {
      let keep = true
      if (amountRange.min) {
        keep = keep && item.amount >= Number(amountRange.min)
      }
      if (amountRange.max) {
        keep = keep && item.amount <= Number(amountRange.max)
      }
      return keep
    })
  }, [data, amountRange])

  const summary = useMemo(() => {
    return {
      totalGrants: data.length,
      approvedGrants: data.filter(d => d.status === "APPROVED" || d.status === "PAID").length,
      pendingGrants: data.filter(d => d.status === "PENDING").length,
      rejectedGrants: data.filter(d => d.status === "REJECTED").length,
      totalAmount: data.reduce((acc, d) => acc + (d.amount || 0), 0),
    }
  }, [data])

  const columns: ColumnDef<GrantWithDetails>[] = [
    {
      accessorKey: "grantNumber",
      header: ({ column }) => {
        return (
          <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="-ml-4">
            {"Sadaqah No"}<ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
    },
    {
      id: "beneficiary",
      header: "Beneficiary",
      cell: ({ row }) => `${row.original.beneficiary?.fullName || "Name not found"} (${row.original.beneficiary?.beneficiaryId})`
    },
    {
      accessorKey: "purpose",
      header: "Purpose",
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => `৳${formatCurrency(row.original.amount)}`
    },
    {
      accessorKey: "dateApproved",
      header: "Date",
      cell: ({ row }) => row.original.dateApproved ? formatDate(row.original.dateApproved) : "N/A"
    },
    {
      id: "fundingSource",
      header: "Funding Source",
      cell: ({ row }) => {
        if (row.original.allocations.length === 0) return "-";
        return row.original.allocations.map(a => a.fund?.name || "").filter(Boolean).join(", ") || "-";
      }
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.original.status === "PAID" || row.original.status === "APPROVED" ? "default" : row.original.status === "REJECTED" ? "destructive" : "secondary"}>
          {(({ PENDING: "Pending", APPROVED: "Approved", REJECTED: "Rejected", COMPLETED: "Completed" } as Record<string, string>)[row.original.status] || row.original.status)}
        </Badge>
      )
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const grant = row.original
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
                  <Link href={`/grants/${grant.id}`}>
                    <Eye className="mr-2 h-4 w-4" /> {"View Details"}</Link>
                </DropdownMenuItem>
              )}
              {manageMode && (
                <>
                  {canEdit && (
                    <DropdownMenuItem asChild>
                      <Link href={`/grants/${grant.id}/edit`}>
                        <Edit className="mr-2 h-4 w-4" /> {"Edit Sadaqah"}</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <Link href={`/grants/ledger?grantId=${grant.id}`}>
                      <BookOpen className="mr-2 h-4 w-4" /> {"View Ledger"}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                              return (window.print());
                            }}>
                    <Printer className="mr-2 h-4 w-4" /> {"Print"}</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {canDelete && (
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={async () => {
                        if (confirm("Are you sure you want to delete this Sadaqah?")) {
                          const res = await deleteGrant(grant.id)
                          if (res.success) {
                            toast.success("Sadaqah deleted successfully")
                            window.location.reload()
                          }
                          else toast.error(res.error || "Failed to delete Sadaqah")
                        }
                      }}
                    >
                      <Trash className="mr-2 h-4 w-4" /> {"Delete Sadaqah"}</DropdownMenuItem>
                  )}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
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
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: globalSearchFn,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
  })

  return (
    <div className="space-y-6">
      {manageMode && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground font-medium mb-1">{"Total Sadaqah"}</div>
                <div className="text-2xl font-bold">{summary.totalGrants}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground font-medium mb-1">{"Approved"}</div>
                <div className="text-2xl font-bold text-green-600">{summary.approvedGrants}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground font-medium mb-1">{"Pending"}</div>
                <div className="text-2xl font-bold text-orange-600">{summary.pendingGrants}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground font-medium mb-1">{"Rejected"}</div>
                <div className="text-2xl font-bold text-red-600">{summary.rejectedGrants}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground font-medium mb-1">{"Total Amount"}</div>
                <div className="text-xl font-bold">৳{formatCurrency(summary.totalAmount)}</div>
              </CardContent>
            </Card>
          </div>
          
          <div className="bg-card border rounded-md p-4 space-y-4">
            <div className="flex items-center gap-2 font-medium">
              <FilterX className="h-5 w-5" />
              {"Filter Sadaqah"}</div>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="lg:col-span-3">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={"Search Sadaqah..."}
                    value={globalFilter ?? ""}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              
              <div className="lg:col-span-1">
                <Select
                  value={(table.getColumn("status")?.getFilterValue() as string) ?? "ALL"}
                  onValueChange={(v) => table.getColumn("status")?.setFilterValue(v === "ALL" ? "" : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={"Status"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">{"All Statuses"}</SelectItem>
                    <SelectItem value="PENDING">{"Pending"}</SelectItem>
                    <SelectItem value="APPROVED">{"Approved"}</SelectItem>
                    <SelectItem value="REJECTED">{"Rejected"}</SelectItem>
                    <SelectItem value="PAID">{"Completed"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="lg:col-span-2 flex items-center gap-2">
                <Input 
                  type="number" 
                  placeholder={"Min Amount"} 
                  value={amountRange.min}
                  onChange={e => setAmountRange(p => ({ ...p, min: e.target.value }))}
                />
                <Input 
                  type="number" 
                  placeholder={"Max Amount"}
                  value={amountRange.max}
                  onChange={e => setAmountRange(p => ({ ...p, max: e.target.value }))}
                />
              </div>
            </div>
          </div>
        </>
      )}

      <div className="rounded-md border bg-card mt-4">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => {
              return ((
                          <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => (
                              <TableHead key={header.id}>
                                {header.isPlaceholder
                                  ? null
                                  : flexRender(
                                      header.column.columnDef.header,
                                      header.getContext()
                                    )}
                              </TableHead>
                            ))}
                          </TableRow>
                        ));
            })}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => {
                return ((
                              <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
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
                <TableCell colSpan={columns.length} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <span className="text-muted-foreground">{"No Sadaqah found."}</span>
                    <span className="text-sm text-muted-foreground">{"Create your first Sadaqah."}</span>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-2">
        <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
          {"Previous"}</Button>
        <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
          {"Next"}</Button>
      </div>
    </div>
  )
}
