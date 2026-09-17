"use client"
import { formatDate } from "@/lib/format"
import { useState, useMemo } from "react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  SortingState,
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
import { 
  Eye, 
  Edit, 
  MoreHorizontal, 
  ArrowUpDown,
  FileText,
  CreditCard,
  Printer,
  CheckCircle,
  Trash2,
  BookOpen,
  Search,
  FilterX
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import Link from "next/link"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { deleteLoanAction } from "../actions"
import { useRbac } from "@/components/providers/rbac-provider"

const globalSearchFn: FilterFn<any> = (row, columnId, value, addMeta) => {
  const searchValue = value.toLowerCase()
  const loanNumber = (row.original.loanNumber ).toLowerCase()
  const beneficiaryName = (row.original.beneficiary?.fullName ).toLowerCase()
  const phone = (row.original.beneficiary?.phone ).toLowerCase()
  return loanNumber.includes(searchValue) || beneficiaryName.includes(searchValue) || phone.includes(searchValue)
}

export function LoansTable({ data }: { data: any[] }) {
      const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState("")
  const [amountRange, setAmountRange] = useState({ min: "", max: "" })
  const router = useRouter()
  const { can } = useRbac()

  const canView = can("Loans", "View")
  const canEdit = can("Loans", "Edit")
  const canDelete = can("Loans", "Delete")
  const canManage = can("Loans", "Manage")

  const handleDelete = async (id: string, hasRepayments: boolean) => {
    if (hasRepayments) {
      toast.error("Cannot delete Qard Hasan with existing repayments." )
      return
    }
    if (!confirm("Are you sure you want to delete this Qard Hasan?" )) return

    const res = await deleteLoanAction(id)
    if (res.success) {
      toast.success("Qard Hasan deleted successfully." )
      router.refresh()
    } else {
      toast.error(res.error)
    }
  }

  const handleMarkAsCompleted = async (id: string) => {
    toast.info("Coming soon!" )
  }

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
      totalLoans: data.length,
      activeLoans: data.filter(d => d.status === "ACTIVE").length,
      completedLoans: data.filter(d => d.status === "COMPLETED").length,
      dueToday: data.filter(d => d.dueStatus === "Due Today").length,
      overdueLoans: data.filter(d => d.dueStatus === "Overdue").length,
      totalOutstanding: data.reduce((acc, d) => acc + (d.remainingBalance || 0), 0),
      totalRecovered: data.reduce((acc, d) => acc + (d.totalPaidAmount || 0), 0),
    }
  }, [data])

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "loanNumber",
      header: ({ column }) => {
        return ((
              <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
                {"Qard Hasan No"}<ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            ));
      },
    },
    {
      id: "beneficiary",
      accessorFn: row => row.beneficiary ? row.beneficiary.fullName : "Unknown",
      header: "Beneficiary",
    },
    {
      id: "phone",
      header: "Phone",
      cell: ({ row }) => row.original.beneficiary?.phone 
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => `৳${(row.getValue("amount") as number)}`,
    },
    {
      id: "remaining",
      header: "Remaining Balance",
      cell: ({ row }) => `৳${row.original.remainingBalance}`,
    },
    {
      id: "nextDueDate",
      header: "Next Due",
      cell: ({ row }) => row.original.nextDueDate ? formatDate(row.original.nextDueDate) : "-",
    },
    {
      accessorKey: "dueStatus",
      header: "Due Status",
      cell: ({ row }) => {
        const status = row.getValue("dueStatus") as string
        let variant: "default" | "secondary" | "destructive" | "outline" = "outline"
        if (status === "Due Today") variant = "default"
        if (status === "Overdue") variant = "destructive"
        if (status === "Completed") variant = "secondary"
        return <Badge variant={variant}>{status}</Badge>
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const s = row.getValue("status") as string
        return (
          <Badge variant={s === "ACTIVE" ? "default" : s === "COMPLETED" ? "secondary" : "destructive"}>
            {s}
          </Badge>
        )
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const loan = row.original
        const hasRepayments = loan.repayments && loan.repayments.length > 0
        const isEligibleForCompletion = loan.status === "ACTIVE"

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
                  <Link href={`/loans/${loan.id}`}>
                    <Eye className="mr-2 h-4 w-4" /> {"View Details"}</Link>
                </DropdownMenuItem>
              )}
              {canEdit && (
                <DropdownMenuItem asChild>
                  <Link href={`/loans/${loan.id}/edit`}>
                    <Edit className="mr-2 h-4 w-4" /> {"Edit Qard Hasan"}</Link>
                </DropdownMenuItem>
              )}
              {canManage && isEligibleForCompletion && loan.remainingBalance > 0 && (
                <DropdownMenuItem asChild>
                  <Link href={`/loans/repayments?loanId=${loan.id}`}>
                    <CreditCard className="mr-2 h-4 w-4" /> {"Receive Repayment"}</Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {canView && (
                <>
                  <DropdownMenuItem asChild>
                    <Link href={`/loans/${loan.id}#history`}>
                      <FileText className="mr-2 h-4 w-4" /> {"View Ledger"}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/loans/ledger?loanId=${loan.id}`}>
                      <BookOpen className="mr-2 h-4 w-4" /> {"View Ledger"}</Link>
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuItem onClick={() => {
                      return (window.print());
                    }}>
                <Printer className="mr-2 h-4 w-4" /> {"Print"}</DropdownMenuItem>
              <DropdownMenuSeparator />
              {canDelete && (
                <DropdownMenuItem 
                  onClick={() => handleDelete(loan.id, hasRepayments)}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" /> {"Delete Qard Hasan"}</DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
    {
      accessorKey: "loanType",
      enableHiding: true,
      header: () => null,
      cell: () => null,
    }
  ]

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    globalFilterFn: globalSearchFn,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      columnFilters,
      sorting,
      globalFilter,
    },
    initialState: {
      columnVisibility: {
        loanType: false
      }
    }
  })

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground font-medium mb-1">{"Total Qard Hasan" }</div>
            <div className="text-2xl font-bold">{summary.totalLoans}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground font-medium mb-1">{"Active Qard Hasan" }</div>
            <div className="text-2xl font-bold text-blue-600">{summary.activeLoans}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground font-medium mb-1">{"Completed Qard Hasan" }</div>
            <div className="text-2xl font-bold text-green-600">{summary.completedLoans}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 bg-orange-50">
            <div className="text-xs text-muted-foreground font-medium mb-1">{"Due Today"}</div>
            <div className="text-2xl font-bold text-orange-600">{summary.dueToday}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 bg-red-50">
            <div className="text-xs text-muted-foreground font-medium mb-1">{"Overdue Qard Hasan"}</div>
            <div className="text-2xl font-bold text-red-600">{summary.overdueLoans}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground font-medium mb-1">{"Total Outstanding"}</div>
            <div className="text-xl font-bold">৳{summary.totalOutstanding}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground font-medium mb-1">{"Total Recovered"}</div>
            <div className="text-xl font-bold text-green-600">৳{summary.totalRecovered}</div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-card border rounded-md p-4 space-y-4">
        <div className="flex items-center gap-2 font-medium">
          <FilterX className="h-5 w-5" />
          {"Filter Qard Hasan"}</div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={"Search Qard Hasan..."}
                value={globalFilter ?? ""}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          
          <Select
            value={(table.getColumn("loanType")?.getFilterValue() as string) ?? "ALL"}
            onValueChange={(v) => table.getColumn("loanType")?.setFilterValue(v === "ALL" ? "" : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder={"Type"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{"All Types"}</SelectItem>
              <SelectItem value="BUSINESS">{"Business"}</SelectItem>
              <SelectItem value="OTHER">{"Other"}</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={(table.getColumn("status")?.getFilterValue() as string) ?? "ALL"}
            onValueChange={(v) => table.getColumn("status")?.setFilterValue(v === "ALL" ? "" : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder={"Status"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{"All Statuses"}</SelectItem>
              <SelectItem value="ACTIVE">{"Active"}</SelectItem>
              <SelectItem value="COMPLETED">{"Completed"}</SelectItem>
              <SelectItem value="OVERDUE">{"Overdue"}</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={(table.getColumn("dueStatus")?.getFilterValue() as string) ?? "ALL"}
            onValueChange={(v) => table.getColumn("dueStatus")?.setFilterValue(v === "ALL" ? "" : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder={"Due Status"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{"All Due Statuses"}</SelectItem>
              <SelectItem value="Due Today">{"Due Today"}</SelectItem>
              <SelectItem value="Upcoming Due">{"Upcoming Due"}</SelectItem>
              <SelectItem value="Overdue">{"Overdue"}</SelectItem>
              <SelectItem value="No Due">{"No Due"}</SelectItem>
              <SelectItem value="Completed">{"Completed"}</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <Input 
              type="number" 
              placeholder={"Min"} 
              value={amountRange.min}
              onChange={e => setAmountRange(p => ({ ...p, min: e.target.value }))}
            />
            <Input 
              type="number" 
              placeholder={"Max"}
              value={amountRange.max}
              onChange={e => setAmountRange(p => ({ ...p, max: e.target.value }))}
            />
          </div>
        </div>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => {
              return ((
                          <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => (
                              <TableHead key={header.id}>
                                {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
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
                              <TableRow key={row.id}>
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
                  {"No Qard Hasan found."}</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2">
        <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
          {"Previous"}</Button>
        <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
          {"Next"}</Button>
      </div>
    </div>
  )
}
