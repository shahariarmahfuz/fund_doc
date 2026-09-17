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
import { Download, Eye, FileText, Image as ImageIcon } from "lucide-react"
import Link from "next/link"

export function DocumentsTable({ data }: { data: any[] }) {
      const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "documentNumber",
      header: "Doc #",
    },
    {
      accessorKey: "title",
      header: "Title",
    },
    {
      id: "type",
      header: "Type",
      cell: ({ row }) => {
        return ((
              <div className="flex items-center space-x-2">
                {row.original.type === "IMAGE" ? <ImageIcon className="h-4 w-4 text-muted-foreground" /> : <FileText className="h-4 w-4 text-muted-foreground" />}
                <span>{row.original.mimeType.split('/')[1].toUpperCase()}</span>
              </div>
            ));
      },
    },
    {
      id: "category",
      header: "Category",
      cell: ({ row }) => row.original.category ? <Badge variant="outline">{row.original.category.name}</Badge> : "None"
    },
    {
      accessorKey: "targetType",
      header: "Linked Entity",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-xs font-semibold">{row.getValue("targetType")}</span>
          <span className="text-xs text-muted-foreground">{row.original.entityId}</span>
        </div>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Uploaded",
      cell: ({ row }) => formatDate(row.getValue("createdAt")),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        return ((
              <div className="flex space-x-2">
                <Button variant="ghost" size="icon" asChild title={"View"}>
                  <a href={row.original.url} target="_blank" rel="noreferrer">
                    <Eye className="h-4 w-4" />
                  </a>
                </Button>
                <Button variant="ghost" size="icon" asChild title={"Download"}>
                  <a href={row.original.url} download={row.original.originalFilename}>
                    <Download className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            ));
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
    state: {
      columnFilters,
    },
  })

  return (
    <div>
      <div className="flex items-center space-x-2 py-2">
        <Input
          placeholder={"Filter by title..."}
          value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("title")?.setFilterValue(event.target.value)
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
                  {"No documents found."}</TableCell>
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
