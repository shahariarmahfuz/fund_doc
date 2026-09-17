"use client"
import { formatCurrency, formatDate } from "@/lib/format"

import { useState } from "react"
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
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Wallet, BookOpen } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type MemberDue = {
  id: string
  memberId: string
  name: string
  phone: string
  group: string
  joinDate: Date | null
  expectedContribution: number
  paid: number
  advanceBalance: number
  currentDue: number
  status: string
  nextDueDate: Date | null
  lastCollectionDate: Date | null
}

export function MemberDuesTable({ data }: { data: MemberDue[] }) {
      const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState("")

  const columns: ColumnDef<MemberDue>[] = [
    {
      accessorKey: "name",
      header: "Member Name",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.getValue("name")}</div>
          <div className="text-xs text-muted-foreground">{row.original.phone || row.original.memberId}</div>
        </div>
      )
    },
    {
      accessorKey: "group",
      header: "Group",
    },
    {
      accessorKey: "joinDate",
      header: "Join Date",
      cell: ({ row }) => {
        const d = row.getValue("joinDate") as Date | null
        return d ? formatDate(d) : 'N/A'
      },
      filterFn: (row, id, filterValue) => {
        if (!filterValue) return true;
        const d = row.getValue(id) as Date | null;
        if (!d) return false;
        const month = d.getMonth() + 1; // 1-12
        return month.toString() === filterValue;
      }
    },
    {
      accessorKey: "monthlyContribution",
      header: "Monthly Contribution",
      cell: ({ row }) => `৳${formatCurrency(row.getValue("monthlyContribution") as number || 0)}`
    },
    {
      accessorKey: "expectedContribution",
      header: "Expected",
      cell: ({ row }) => `৳${formatCurrency(row.getValue("expectedContribution") as number)}`
    },
    {
      accessorKey: "paid",
      header: "Paid",
      cell: ({ row }) => `৳${formatCurrency(row.getValue("paid") as number)}`
    },
    {
      accessorKey: "advanceBalance",
      header: "Advance",
      cell: ({ row }) => {
        const amt = row.getValue("advanceBalance") as number
        return amt > 0 ? <span className="text-green-600 font-medium">৳{formatCurrency(amt)}</span> : "৳0.00"
      }
    },
    {
      accessorKey: "currentDue",
      header: "Due",
      cell: ({ row }) => {
        const amount = row.getValue("currentDue") as number
        return (
          <span className={`font-semibold ${amount > 0 ? "text-destructive" : "text-muted-foreground"}`}>
            ৳{formatCurrency(amount)}
          </span>
        )
      }
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        let variant: "default" | "secondary" | "destructive" | "outline" = "default"
        if (status === "Paid" || status === "Advance") variant = "default"
        if (status === "Due") variant = "destructive"
        return <Badge variant={variant}>{status}</Badge>
      },
      filterFn: (row, id, value) => {
        if (value === "all") return true;
        return row.getValue(id) === value;
      }
    },
    {
      accessorKey: "lastCollectionDate",
      header: "Last Payment",
      cell: ({ row }) => {
        const d = row.getValue("lastCollectionDate") as Date
        return d ? formatDate(d) : 'N/A'
      }
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const member = row.original
        return (
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/members/ledger?memberId=${member.id}`}>
                <BookOpen className="mr-2 h-4 w-4" /> {"Ledger"}</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href={`/contributions/new?memberId=${member.id}`}>
                <Wallet className="mr-2 h-4 w-4" /> {"Collect"}</Link>
            </Button>
          </div>
        )
      },
    },
  ]

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, columnId, filterValue) => {
      const search = filterValue.toLowerCase()
      const name = row.original.name.toLowerCase()
      const phone = (row.original.phone || "").toLowerCase()
      const memberId = row.original.memberId.toLowerCase()
      return name.includes(search) || phone.includes(search) || memberId.includes(search)
    },
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
  })

  return (
    <div>
      <div className="flex flex-col md:flex-row items-center space-x-0 md:space-x-2 space-y-2 md:space-y-0 py-2 flex-wrap gap-y-2">
        <Input
          placeholder={"Search by member name or ID"}
          value={globalFilter ?? ""}
          onChange={(event) => setGlobalFilter(event.target.value)}
          className="max-w-sm"
        />
        <Input
          placeholder={"Filter by group"}
          value={(table.getColumn("group")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("group")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <Select
          value={(table.getColumn("status")?.getFilterValue() as string) ?? "all"}
          onValueChange={(value) => table.getColumn("status")?.setFilterValue(value === "all" ? "" : value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={"Due Status"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{"All Statuses"}</SelectItem>
            <SelectItem value="Paid">{"Paid"}</SelectItem>
            <SelectItem value="Due">{"Due"}</SelectItem>
            <SelectItem value="Advance">{"Advance"}</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={(table.getColumn("joinDate")?.getFilterValue() as string) ?? "all"}
          onValueChange={(value) => table.getColumn("joinDate")?.setFilterValue(value === "all" ? "" : value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={"Join Month"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{"All Months"}</SelectItem>
            <SelectItem value="1">{"January"}</SelectItem>
            <SelectItem value="2">{"February"}</SelectItem>
            <SelectItem value="3">{"March"}</SelectItem>
            <SelectItem value="4">{"April"}</SelectItem>
            <SelectItem value="5">{"May"}</SelectItem>
            <SelectItem value="6">{"June"}</SelectItem>
            <SelectItem value="7">{"July"}</SelectItem>
            <SelectItem value="8">{"August"}</SelectItem>
            <SelectItem value="9">{"September"}</SelectItem>
            <SelectItem value="10">{"October"}</SelectItem>
            <SelectItem value="11">{"November"}</SelectItem>
            <SelectItem value="12">{"December"}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="rounded-md border bg-card overflow-x-auto">
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
    </div>
  )
}
