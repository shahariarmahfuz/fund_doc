"use client"
import { formatDate } from "@/lib/format"

import { useState } from "react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { ChevronDown, ChevronRight, Printer, Search } from "lucide-react"

export function LoanLedgerTable({ transactions }: { transactions: any[] }) {
      const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "date",
      header: "Date" ,
      cell: ({ row }) => formatDate(row.getValue("date")),
    },
    {
      accessorKey: "referenceId",
      header: "Qard Hasan No" ,
    },
    {
      accessorKey: "beneficiaryName",
      header: "Beneficiary" ,
    },
    {
      accessorKey: "type",
      header: "Type" ,
      cell: ({ row }) => {
        const type = row.getValue("type") as string
        return <Badge variant={type === "LOAN" ? "destructive" : "default"}>{type}</Badge>
      }
    },
    {
      accessorKey: "debit",
      header: () => {
        return (<div className="text-right">{"Debit"}</div>);
      },
      cell: ({ row }) => {
        const amount = row.getValue("debit") as number
        return <div className="text-right text-red-600 font-medium">{amount > 0 ? `৳${amount}` : "-"}</div>
      }
    },
    {
      accessorKey: "credit",
      header: () => {
        return (<div className="text-right">{"Credit"}</div>);
      },
      cell: ({ row }) => {
        const amount = row.getValue("credit") as number
        return <div className="text-right text-green-600 font-medium">{amount > 0 ? `৳${amount}` : "-"}</div>
      }
    },
    {
      accessorKey: "balance",
      header: () => {
        return (<div className="text-right">{"Remaining Balance"}</div>);
      },
      cell: ({ row }) => {
        const amount = row.getValue("balance") as number
        return <div className="text-right font-bold">৳{amount}</div>
      }
    },
    {
      accessorKey: "notes",
      header: "Comment" ,
    },
    {
      id: "actions",
      header: "Actions" ,
      cell: ({ row }) => {
        return (
          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm">
                {"View Details"}<ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 space-y-2 text-sm bg-muted/50 p-2 rounded-md">
              <div className="grid grid-cols-3 font-semibold mb-1">
                <div>{"Funding Source"}</div>
                <div className="text-right">{"Debit"}</div>
                <div className="text-right">{"Credit"}</div>
              </div>
              {row.original.entries.map((e: any) => (
                <div key={e.id} className="grid grid-cols-3">
                  <div>{e.fund?.group ? `${e.fund.group.name} (${e.fund.name})` : e.fund?.name}</div>
                  <div className="text-right">{!e.isCredit ? `৳${e.amount}` : "-"}</div>
                  <div className="text-right">{e.isCredit ? `৳${e.amount}` : "-"}</div>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        )
      }
    }
  ]

  const [globalFilter, setGlobalFilter] = useState("")

  const table = useReactTable({
    data: transactions,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: "includesString",
    state: { columnFilters, globalFilter },
  })

  return (
    <div className="space-y-4 print-section">
      <div className="flex justify-between items-center no-print">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={"Search Qard Hasan..."}
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button variant="outline" onClick={() => {
                return (window.print());
              }}>
          <Printer className="mr-2 h-4 w-4" />
          {"Print" }</Button>
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
