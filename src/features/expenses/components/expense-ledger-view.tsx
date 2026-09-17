"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  BookOpen,
  Calendar,
  Filter,
  Search,
  RotateCcw,
  Printer,
  Receipt,
  Plus,
  Building2,
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { formatDate, formatCurrency } from "@/lib/format"
import type { ExpenseLedgerData, ExpenseName, Group } from "@/types/models"

interface ExpenseLedgerViewProps {
  ledgerData: ExpenseLedgerData
  expenseNames: ExpenseName[]
  groups?: Group[]
  initialStartDate?: string
  initialEndDate?: string
  initialExpenseNameId?: string
  initialGroupId?: string
  initialSearch?: string
  currentPage: number
}

export function ExpenseLedgerView({
  ledgerData,
  expenseNames,
  groups = [],
  initialStartDate = "",
  initialEndDate = "",
  initialExpenseNameId = "",
  initialGroupId = "",
  initialSearch = "",
  currentPage,
}: ExpenseLedgerViewProps) {
  const router = useRouter()

  const [startDate, setStartDate] = useState(initialStartDate)
  const [endDate, setEndDate] = useState(initialEndDate)
  const [categoryFilter, setCategoryFilter] = useState(initialExpenseNameId)
  const [groupFilter, setGroupFilter] = useState(initialGroupId)
  const [search, setSearch] = useState(initialSearch)

  const handleApplyFilter = () => {
    const params = new URLSearchParams()
    if (startDate) params.set("startDate", startDate)
    if (endDate) params.set("endDate", endDate)
    if (categoryFilter) params.set("expenseNameId", categoryFilter)
    if (groupFilter) params.set("groupId", groupFilter)
    if (search) params.set("search", search)
    params.set("page", "1")
    router.push(`/expenses/ledger?${params.toString()}`)
  }

  const handleResetFilter = () => {
    setStartDate("")
    setEndDate("")
    setCategoryFilter("")
    setGroupFilter("")
    setSearch("")
    router.push("/expenses/ledger")
  }

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams()
    if (startDate) params.set("startDate", startDate)
    if (endDate) params.set("endDate", endDate)
    if (categoryFilter) params.set("expenseNameId", categoryFilter)
    if (groupFilter) params.set("groupId", groupFilter)
    if (search) params.set("search", search)
    params.set("page", String(newPage))
    router.push(`/expenses/ledger?${params.toString()}`)
  }

  const handlePrint = () => {
    window.print()
  }

  const hasFilter = Boolean(startDate || endDate || categoryFilter || groupFilter || search)
  const isEmpty = ledgerData.items.length === 0

  return (
    <div className="space-y-6">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-surface-900">Expense Ledger</h2>
          <p className="text-sm text-surface-500">
            Chronological audit ledger of all operational disbursements and expenditures.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2">
            <Printer className="w-4 h-4" />
            Print Ledger
          </Button>
          <Link href="/expenses/manage">
            <Button variant="outline" size="sm">
              Manage Expenses
            </Button>
          </Link>
          <Link href="/expenses/new">
            <Button size="sm" className="bg-primary-600 hover:bg-primary-700 text-white gap-2">
              <Plus className="w-4 h-4" />
              Add Expense
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Card */}
      <Card className="shadow-sm border-surface-200">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="relative">
              <label className="text-xs font-semibold text-surface-600 mb-1 block">Search</label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                <Input
                  placeholder="Search comment or name..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleApplyFilter()}
                  className="pl-9 h-9 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-surface-600 mb-1 block">Funding Group</label>
              <Select
                value={groupFilter || "ALL"}
                onValueChange={val => setGroupFilter(val === "ALL" ? "" : val)}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="All Groups" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Groups</SelectItem>
                  {groups.map(g => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-semibold text-surface-600 mb-1 block">Category</label>
              <Select
                value={categoryFilter || "ALL"}
                onValueChange={val => setCategoryFilter(val === "ALL" ? "" : val)}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Categories</SelectItem>
                  {expenseNames.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-semibold text-surface-600 mb-1 block">From Date</label>
              <Input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="h-9 text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-surface-600 mb-1 block">To Date</label>
              <Input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
          </div>

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-surface-100">
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={handleApplyFilter} className="h-8 gap-1.5 bg-surface-900 text-white hover:bg-surface-800">
                <Filter className="w-3.5 h-3.5" />
                Apply Filter
              </Button>
              {hasFilter && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleResetFilter}
                  className="h-8 gap-1 text-surface-600 hover:text-surface-900"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-surface-500 font-medium">
                Period Total:
              </span>
              <span className="bg-amber-50 text-amber-900 font-bold px-3 py-1 rounded border border-amber-200 text-sm">
                ৳{formatCurrency(ledgerData.totalAmount)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Ledger Table */}
      <Card className="shadow-sm border-surface-200 overflow-hidden">
        <CardHeader className="border-b bg-surface-50/50 py-3.5 px-4 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary-600" />
            Chronological Expense Records ({ledgerData.total} {ledgerData.total === 1 ? "entry" : "entries"})
          </CardTitle>
          <span className="text-xs font-semibold text-surface-500">
            Debit represents Foundation cash outflow
          </span>
        </CardHeader>
        <CardContent className="p-0">
          {isEmpty ? (
            <div className="py-16 text-center text-surface-500">
              <BookOpen className="w-12 h-12 mx-auto mb-3 text-surface-300 stroke-[1.5]" />
              <p className="font-semibold text-base text-surface-800">
                No expense transactions found.
              </p>
              <p className="text-sm text-surface-500 mt-1 max-w-sm mx-auto">
                {hasFilter
                  ? "No ledger records match your current filter settings."
                  : "All recorded expenses will appear here in chronological order."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-surface-50/80 border-b border-surface-200 text-surface-600">
                  <tr>
                    <th className="py-3 px-4 font-semibold w-32">Date</th>
                    <th className="py-3 px-4 font-semibold">Group</th>
                    <th className="py-3 px-4 font-semibold">Expense</th>
                    <th className="py-3 px-4 font-semibold">Comment / Purpose</th>
                    <th className="py-3 px-4 font-semibold text-right w-40">Debit (Outflow)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100 font-mono text-xs sm:text-sm font-normal">
                  {ledgerData.items.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-surface-50/50 transition-colors">
                      <td className="py-3.5 px-4 text-surface-700 whitespace-nowrap font-sans font-medium text-xs sm:text-sm">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-surface-400" />
                          {formatDate(item.date)}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-sans font-medium text-surface-700 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-surface-400" />
                          <span>{item.groupName || "—"}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-sans font-semibold text-surface-900">
                        {item.expenseName}
                      </td>
                      <td className="py-3.5 px-4 font-sans text-surface-600 max-w-md">
                        {item.comment || <span className="text-surface-400 italic">—</span>}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-red-600 whitespace-nowrap">
                        ৳{formatCurrency(item.debit)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-surface-50/90 font-bold border-t-2 border-surface-300 text-surface-900">
                  <tr>
                    <td colSpan={4} className="py-4 px-4 text-right font-sans text-sm uppercase tracking-wider">
                      Total Period Expense (Debit):
                    </td>
                    <td className="py-4 px-4 text-right text-red-600 font-bold text-base whitespace-nowrap">
                      ৳{formatCurrency(ledgerData.totalAmount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* Pagination */}
          {ledgerData.totalPages > 1 && (
            <div className="p-4 border-t border-surface-200 flex items-center justify-between">
              <span className="text-xs text-surface-500">
                Page {currentPage} of {ledgerData.totalPages}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                  className="h-8 text-xs"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= ledgerData.totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                  className="h-8 text-xs"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
