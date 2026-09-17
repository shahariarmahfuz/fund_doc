"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Printer,
  Receipt,
  Calendar,
  Filter,
  RotateCcw,
  Building2,
  Eye,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { formatCurrency, formatDate, formatDateTime } from "@/lib/format"
import { useBranding } from "@/components/providers/branding-provider"
import type { ExpenseReportData, ExpenseName, Group, Expense } from "@/types/models"

interface ExpenseReportViewProps {
  reportData: ExpenseReportData
  expenseNames: ExpenseName[]
  groups?: Group[]
  initialStartDate?: string
  initialEndDate?: string
  initialExpenseNameId?: string
  initialGroupId?: string
}

type SortField = "date" | "amount" | "sl"

export function ExpenseReportView({
  reportData,
  expenseNames,
  groups = [],
  initialStartDate = "",
  initialEndDate = "",
  initialExpenseNameId = "",
  initialGroupId = "",
}: ExpenseReportViewProps) {
  const router = useRouter()
  const branding = useBranding()

  // Filter input states
  const [fromDate, setFromDate] = useState(initialStartDate)
  const [toDate, setToDate] = useState(initialEndDate)
  const [groupFilter, setGroupFilter] = useState(initialGroupId)
  const [expenseNameFilter, setExpenseNameFilter] = useState(initialExpenseNameId)

  // Sorting state (default: date descending)
  const [sortField, setSortField] = useState<SortField>("date")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  // Read-only View Modal state
  const [viewExpense, setViewExpense] = useState<Expense | null>(null)

  // Filter actions
  const handleApplyFilter = () => {
    const params = new URLSearchParams()
    if (fromDate) {
      params.set("fromDate", fromDate)
      params.set("startDate", fromDate)
    }
    if (toDate) {
      params.set("toDate", toDate)
      params.set("endDate", toDate)
    }
    if (groupFilter) params.set("groupId", groupFilter)
    if (expenseNameFilter) params.set("expenseNameId", expenseNameFilter)

    router.push(`/expenses/reports?${params.toString()}`)
  }

  const handleResetFilter = () => {
    setFromDate("")
    setToDate("")
    setGroupFilter("")
    setExpenseNameFilter("")
    router.push("/expenses/reports")
  }

  const handlePrint = () => {
    window.print()
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === "asc" ? "desc" : "asc"))
    } else {
      setSortField(field)
      setSortDirection(field === "sl" ? "asc" : "desc")
    }
  }

  const hasFilter = Boolean(fromDate || toDate || groupFilter || expenseNameFilter)
  const rawItems = reportData.items || []

  // Sorted items
  const sortedItems = useMemo(() => {
    const items = [...rawItems]
    items.sort((a, b) => {
      if (sortField === "date") {
        const dateA = new Date(a.expenseDate).getTime()
        const dateB = new Date(b.expenseDate).getTime()
        return sortDirection === "asc" ? dateA - dateB : dateB - dateA
      }
      if (sortField === "amount") {
        const amtA = Number(a.amount) || 0
        const amtB = Number(b.amount) || 0
        return sortDirection === "asc" ? amtA - amtB : amtB - amtA
      }
      return 0
    })
    return items
  }, [rawItems, sortField, sortDirection])

  // Resolve filter names for Print Header
  const selectedGroup = groups.find(g => g.id === initialGroupId)
  const selectedExpenseName = expenseNames.find(en => en.id === initialExpenseNameId)

  // Date range description for Print Header
  const dateRangeText = useMemo(() => {
    if (initialStartDate && initialEndDate) {
      return `From ${formatDate(initialStartDate)} to ${formatDate(initialEndDate)}`
    }
    if (initialStartDate) {
      return `From ${formatDate(initialStartDate)} onwards`
    }
    if (initialEndDate) {
      return `Up to ${formatDate(initialEndDate)}`
    }
    return "All Recorded Dates"
  }, [initialStartDate, initialEndDate])

  const foundationTitle = branding?.foundationName || "Bratritto Foundation"

  return (
    <div className="space-y-5">
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print hide-print">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-surface-900">Expense Report</h2>
          <p className="text-sm text-surface-500 mt-0.5">
            View Foundation expenses by date and print detailed reports.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="gap-2 border-surface-300 text-surface-700 hover:bg-surface-50 font-medium"
          >
            <Printer className="w-4 h-4 text-surface-600" />
            Print Report
          </Button>
          <Link href="/expenses/manage">
            <Button
              variant="outline"
              size="sm"
              className="border-surface-300 text-surface-700 hover:bg-surface-50 font-medium"
            >
              Manage Expenses
            </Button>
          </Link>
        </div>
      </div>

      {/* FILTER BAR */}
      <Card className="shadow-sm border-surface-200 bg-white no-print hide-print">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* From Date */}
            <div>
              <label className="text-xs font-semibold text-surface-600 mb-1 block">From Date</label>
              <Input
                type="date"
                value={fromDate}
                onChange={e => setFromDate(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleApplyFilter()}
                className="h-9 text-sm border-surface-300"
              />
            </div>

            {/* To Date */}
            <div>
              <label className="text-xs font-semibold text-surface-600 mb-1 block">To Date</label>
              <Input
                type="date"
                value={toDate}
                onChange={e => setToDate(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleApplyFilter()}
                className="h-9 text-sm border-surface-300"
              />
            </div>

            {/* Group Filter */}
            <div>
              <label className="text-xs font-semibold text-surface-600 mb-1 block">Group</label>
              <Select
                value={groupFilter || "ALL"}
                onValueChange={val => setGroupFilter(val === "ALL" ? "" : val)}
              >
                <SelectTrigger className="h-9 text-sm border-surface-300">
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

            {/* Expense Name Filter */}
            <div>
              <label className="text-xs font-semibold text-surface-600 mb-1 block">Expense Name</label>
              <Select
                value={expenseNameFilter || "ALL"}
                onValueChange={val => setExpenseNameFilter(val === "ALL" ? "" : val)}
              >
                <SelectTrigger className="h-9 text-sm border-surface-300">
                  <SelectValue placeholder="All Expense Names" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Expense Names</SelectItem>
                  {expenseNames.map(en => (
                    <SelectItem key={en.id} value={en.id}>
                      {en.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Filter Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-3 pt-3 border-t border-surface-100">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={handleApplyFilter}
                className="h-8 gap-1.5 bg-surface-900 text-white hover:bg-surface-800 font-medium"
              >
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

            {/* Filter Summary */}
            <div className="flex items-center gap-3 text-xs sm:text-sm font-medium text-surface-600">
              <span>
                Total Records: <strong className="text-surface-900">{reportData.totalCount}</strong>
              </span>
              <span className="text-surface-300">|</span>
              <span className="bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-md border border-emerald-200/60 font-semibold">
                Total Expenses: ৳{formatCurrency(reportData.totalAmount)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PRINTABLE REPORT SECTION */}
      <div className="print-section">
        {/* PRINT ONLY HEADER */}
        <div className="print-header hidden mb-6 pb-4 border-b border-gray-300 text-center">
          <h1 className="text-2xl font-extrabold text-gray-900">{foundationTitle}</h1>
          <h2 className="text-lg font-bold text-gray-700 mt-1">Expense Report</h2>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-6 text-xs text-gray-600">
            <div>
              <span className="font-semibold text-gray-800">Date Range: </span>
              <span>{dateRangeText}</span>
            </div>
            {selectedGroup && (
              <div>
                <span className="font-semibold text-gray-800">Group: </span>
                <span>{selectedGroup.name}</span>
              </div>
            )}
            {selectedExpenseName && (
              <div>
                <span className="font-semibold text-gray-800">Expense Name: </span>
                <span>{selectedExpenseName.name}</span>
              </div>
            )}
          </div>
        </div>

        {/* REPORT TABLE */}
        <Card className="shadow-sm border-surface-200 bg-white overflow-hidden print:border-0 print:shadow-none">
          <CardContent className="p-0">
            {sortedItems.length === 0 ? (
              <div className="py-16 text-center text-surface-500">
                <Receipt className="w-12 h-12 mx-auto mb-3 text-surface-300 stroke-[1.5]" />
                <p className="font-semibold text-base text-surface-800">
                  {hasFilter ? "No expense transactions found for selected criteria." : "No expense transactions recorded yet."}
                </p>
                <p className="text-sm text-surface-500 mt-1 max-w-sm mx-auto">
                  {hasFilter
                    ? "Try adjusting your date range, funding group, or expense name filter."
                    : "Expenses recorded in the system will automatically appear in this report."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left text-sm print-table">
                  <thead className="bg-surface-50/80 border-b border-surface-200 text-surface-600 font-semibold print:bg-gray-100">
                    <tr>
                      <th className="py-3 px-3.5 w-12 text-center text-xs font-semibold">SL</th>
                      <th
                        className="py-3 px-3.5 w-32 cursor-pointer select-none hover:text-surface-900"
                        onClick={() => handleSort("date")}
                      >
                        <div className="flex items-center gap-1">
                          <span>Date</span>
                          {sortField === "date" ? (
                            sortDirection === "asc" ? (
                              <ArrowUp className="w-3.5 h-3.5 text-surface-900" />
                            ) : (
                              <ArrowDown className="w-3.5 h-3.5 text-surface-900" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-surface-400 opacity-60" />
                          )}
                        </div>
                      </th>
                      <th className="py-3 px-3.5 w-28">Expense ID</th>
                      <th className="py-3 px-3.5">Expense Name</th>
                      <th className="py-3 px-3.5">Group</th>
                      <th
                        className="py-3 px-3.5 cursor-pointer select-none hover:text-surface-900"
                        onClick={() => handleSort("amount")}
                      >
                        <div className="flex items-center gap-1">
                          <span>Amount</span>
                          {sortField === "amount" ? (
                            sortDirection === "asc" ? (
                              <ArrowUp className="w-3.5 h-3.5 text-surface-900" />
                            ) : (
                              <ArrowDown className="w-3.5 h-3.5 text-surface-900" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-surface-400 opacity-60" />
                          )}
                        </div>
                      </th>
                      <th className="py-3 px-3.5">Note</th>
                      <th className="py-3 px-3.5 w-20 text-right no-print hide-print">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-100">
                    {sortedItems.map((expense, idx) => {
                      const displayExpenseId =
                        expense.expenseId || `EXP-${expense.id.slice(0, 6).toUpperCase()}`
                      const slNo = idx + 1
                      const noteText = expense.note || expense.comment

                      return (
                        <tr
                          key={expense.id}
                          className="hover:bg-surface-50/60 transition-colors"
                        >
                          {/* SL */}
                          <td className="py-3 px-3.5 text-center text-xs font-medium text-surface-500">
                            {slNo}
                          </td>

                          {/* Date */}
                          <td className="py-3 px-3.5 text-surface-700 whitespace-nowrap text-xs">
                            <div className="flex items-center gap-1.5 font-medium">
                              <Calendar className="w-3.5 h-3.5 text-surface-400 no-print" />
                              <span>{formatDate(expense.expenseDate)}</span>
                            </div>
                          </td>

                          {/* Expense ID */}
                          <td className="py-3 px-3.5 font-mono text-xs font-semibold text-surface-800 whitespace-nowrap">
                            <span className="bg-surface-100 text-surface-800 px-2 py-0.5 rounded border border-surface-200 print:border-gray-300 print:bg-transparent">
                              {displayExpenseId}
                            </span>
                          </td>

                          {/* Expense Name */}
                          <td className="py-3 px-3.5 font-semibold text-surface-900">
                            <div className="flex items-center gap-2">
                              <span>{expense.resolvedExpenseName}</span>
                              {expense.customName && !expense.expenseNameId && (
                                <Badge
                                  variant="secondary"
                                  className="text-[10px] px-1.5 py-0 font-normal no-print"
                                >
                                  Custom
                                </Badge>
                              )}
                            </div>
                          </td>

                          {/* Group */}
                          <td className="py-3 px-3.5 text-surface-700 whitespace-nowrap">
                            <div className="flex items-center gap-1.5 font-medium">
                              <Building2 className="w-3.5 h-3.5 text-surface-400 no-print" />
                              <span>{expense.groupName || expense.group?.name || "—"}</span>
                            </div>
                          </td>

                          {/* Amount */}
                          <td className="py-3 px-3.5 font-bold text-surface-950 whitespace-nowrap">
                            ৳{formatCurrency(expense.amount)}
                          </td>

                          {/* Note */}
                          <td className="py-3 px-3.5 text-surface-600 max-w-[220px] truncate text-xs">
                            {noteText || <span className="text-surface-400 italic font-light">—</span>}
                          </td>

                          {/* Actions (View Only) */}
                          <td className="py-3 px-3.5 text-right no-print hide-print">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs font-medium text-surface-600 hover:text-surface-900 gap-1"
                              onClick={() => setViewExpense(expense)}
                              title="View Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View</span>
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  {/* Table Footer with Total */}
                  <tfoot className="bg-surface-50/90 font-bold border-t-2 border-surface-200 text-surface-900 print:bg-gray-100">
                    <tr>
                      <td colSpan={5} className="py-3.5 px-3.5 text-right font-bold text-sm">
                        Total Expenses:
                      </td>
                      <td className="py-3.5 px-3.5 font-extrabold text-sm text-emerald-800 whitespace-nowrap print:text-black">
                        ৳{formatCurrency(reportData.totalAmount)}
                      </td>
                      <td colSpan={2} className="py-3.5 px-3.5 text-xs text-surface-500 font-normal no-print hide-print">
                        ({sortedItems.length} transactions)
                      </td>
                      <td className="py-3.5 px-3.5 print-only hidden" />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* PRINT ONLY FOOTER TOTAL */}
        <div className="print-footer hidden mt-6 pt-4 border-t-2 border-gray-400 flex justify-between items-center text-sm font-bold">
          <span>Total Records: {sortedItems.length}</span>
          <span className="text-base font-extrabold">
            Total Expenses: ৳{formatCurrency(reportData.totalAmount)}
          </span>
        </div>
      </div>

      {/* READ-ONLY VIEW EXPENSE MODAL */}
      <Dialog open={Boolean(viewExpense)} onOpenChange={open => !open && setViewExpense(null)}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-surface-900">
              <Receipt className="w-5 h-5 text-emerald-600" />
              Expense Details
            </DialogTitle>
            <DialogDescription className="text-surface-500 text-sm">
              Read-only financial transaction details for this operational expense.
            </DialogDescription>
          </DialogHeader>

          {viewExpense && (
            <div className="space-y-3 py-2 text-sm">
              <div className="grid grid-cols-2 gap-2 bg-surface-50 p-3 rounded-lg border border-surface-200/60">
                <div>
                  <span className="text-xs text-surface-500 block">Expense ID</span>
                  <span className="font-mono font-semibold text-surface-900">
                    {viewExpense.expenseId || `EXP-${viewExpense.id.slice(0, 6).toUpperCase()}`}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-surface-500 block">Expense Date</span>
                  <span className="font-medium text-surface-900">
                    {formatDate(viewExpense.expenseDate)}
                  </span>
                </div>
              </div>

              <div className="space-y-2 border-t pt-2 border-surface-100">
                <div className="flex justify-between py-1.5 border-b border-surface-100">
                  <span className="text-surface-500">Expense Name:</span>
                  <span className="font-semibold text-surface-900">{viewExpense.resolvedExpenseName}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-surface-100">
                  <span className="text-surface-500">Funding Group:</span>
                  <span className="font-medium text-surface-800">
                    {viewExpense.groupName || viewExpense.group?.name || "—"}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-surface-100">
                  <span className="text-surface-500">Amount:</span>
                  <span className="font-bold text-base text-emerald-700">
                    ৳{formatCurrency(viewExpense.amount)}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-surface-100">
                  <span className="text-surface-500">Recorded By:</span>
                  <span className="text-surface-800">{viewExpense.creatorName || "System"}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-surface-100">
                  <span className="text-surface-500">Created At:</span>
                  <span className="text-surface-800 text-xs">
                    {formatDateTime(viewExpense.createdAt)}
                  </span>
                </div>
                {viewExpense.ledgerTransactionId && (
                  <div className="flex justify-between py-1.5 border-b border-surface-100">
                    <span className="text-surface-500">Ledger Ref:</span>
                    <span className="font-mono text-xs text-surface-600">
                      {viewExpense.ledgerTransactionId.slice(0, 8)}...
                    </span>
                  </div>
                )}
                <div className="pt-2">
                  <span className="text-surface-500 block text-xs mb-1">Note:</span>
                  <p className="bg-surface-50 p-2.5 rounded border border-surface-200/60 text-xs text-surface-800 italic">
                    {viewExpense.note || viewExpense.comment || "No note attached to this expense."}
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewExpense(null)}
              className="border-surface-300 text-surface-700 hover:bg-surface-50 font-medium"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PRINT CSS */}
      <style jsx global>{`
        @media print {
          @page {
            margin: 1.2cm 1cm;
            size: auto;
          }
          body * {
            visibility: hidden;
          }
          .print-section,
          .print-section * {
            visibility: visible;
          }
          .print-section {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }
          .print-header {
            display: block !important;
          }
          .print-footer {
            display: flex !important;
          }
          .no-print,
          .hide-print {
            display: none !important;
          }
          .print-table {
            width: 100% !important;
            border-collapse: collapse !important;
          }
          .print-table th,
          .print-table td {
            border: 1px solid #d1d5db !important;
            padding: 6px 10px !important;
            color: black !important;
          }
        }
      `}</style>
    </div>
  )
}

export default ExpenseReportView
