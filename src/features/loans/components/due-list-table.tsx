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
import { Printer, Search, FilterX } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const globalSearchFn: FilterFn<any> = (row, columnId, value, addMeta) => {
  const searchValue = value.toLowerCase()
  const loanNumber = (row.original.loanNumber || "").toLowerCase()
  const beneficiaryName = (row.original.beneficiary?.fullName || "").toLowerCase()
  const phone = (row.original.beneficiary?.phone || "").toLowerCase()
  return loanNumber.includes(searchValue) || beneficiaryName.includes(searchValue) || phone.includes(searchValue)
}

export function DueListTable({ data, initialDueStatusFilter = "ALL" }: { data: any[], initialDueStatusFilter?: string }) {
      const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState("")

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "loanNumber",
      header: "Qard Hasan No",
    },
    {
      id: "beneficiary",
      accessorFn: row => row.beneficiary ? row.beneficiary.fullName : "Unknown",
      header: "Beneficiary",
    },
    {
      id: "phone",
      header: "Phone",
      cell: ({ row }) => row.original.beneficiary?.phone || row.original.beneficiary?.mobile || "-"
    },
    {
      id: "group",
      header: "Group",
      cell: ({ row }) => row.original.beneficiary?.member?.group?.name || "-"
    },
    {
      accessorKey: "installmentType",
      header: "Installment Type",
      cell: ({ row }) => row.getValue("installmentType") || "-"
    },
    {
      id: "nextDueDate",
      header: "First Installment Date",
      cell: ({ row }) => row.original.nextDueDate ? formatDate(row.original.nextDueDate) : "-",
    },
    {
      id: "remainingBalance",
      header: "Remaining Balance",
      cell: ({ row }) => <span className="font-medium text-red-600">৳{row.original.remainingBalance}</span>,
    },
    {
      accessorKey: "dueStatus",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("dueStatus") as string
        let variant: "default" | "secondary" | "destructive" | "outline" = "outline"
        if (status === "Due Today") variant = "default"
        if (status === "Overdue") variant = "destructive"
        return <Badge variant={variant}>{status}</Badge>
      },
    },
  ]

  const table = useReactTable({
    data,
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
  })

  // Set initial filter on mount if provided
  useMemo(() => {
    if (initialDueStatusFilter !== "ALL") {
      table.getColumn("dueStatus")?.setFilterValue(initialDueStatusFilter)
    }
  }, [initialDueStatusFilter, table])

  return (
    <div className="space-y-4 print-section">
      <div className="bg-card border rounded-md p-4 space-y-4 no-print">
        <div className="flex items-center justify-between font-medium">
          <div className="flex items-center gap-2">
            <FilterX className="h-5 w-5" />
            {"Filter Dues"}</div>
          <Button variant="outline" onClick={() => {
                    return (window.print());
                  }}>
            <Printer className="mr-2 h-4 w-4" />
            {"Print"}</Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={"Search Qard Hasan..."}
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-8"
            />
          </div>
          
          <Select
            value={(table.getColumn("dueStatus")?.getFilterValue() as string) ?? "ALL"}
            onValueChange={(v) => table.getColumn("dueStatus")?.setFilterValue(v === "ALL" ? "" : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder={"Due Status"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{"All Dues"}</SelectItem>
              <SelectItem value="Due Today">{"Due Today"}</SelectItem>
              <SelectItem value="Upcoming Due">{"Upcoming Due"}</SelectItem>
              <SelectItem value="Overdue">{"Overdue"}</SelectItem>
            </SelectContent>
          </Select>
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
      <div className="flex items-center justify-end space-x-2 no-print">
        <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
          {"Previous"}</Button>
        <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
          {"Next"}</Button>
      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-section, .print-section * {
            visibility: visible;
          }
          .print-section {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  )
}
