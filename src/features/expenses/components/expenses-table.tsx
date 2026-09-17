"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Search,
  Filter,
  Plus,
  Receipt,
  Calendar,
  Eye,
  Pencil,
  Trash2,
  AlertTriangle,
  Loader2,
  RotateCcw,
  Building2,
  Tag,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { formatDate, formatDateTime, formatCurrency } from "@/lib/format"
import { deleteExpense } from "../actions"
import type { Expense, ExpenseName, Group } from "@/types/models"

interface ExpensesTableProps {
  initialExpenses: Expense[]
  total: number
  totalAmount: number
  currentPage: number
  pageSize: number
  totalPages: number
  expenseNames: ExpenseName[]
  groups?: Group[]
  initialSearch?: string
  initialExpenseNameId?: string
  initialGroupId?: string
  initialStartDate?: string
  initialEndDate?: string
}

export function ExpensesTable({
  initialExpenses,
  total,
  totalAmount,
  currentPage,
  pageSize,
  totalPages,
  expenseNames,
  groups = [],
  initialSearch = "",
  initialExpenseNameId = "",
  initialGroupId = "",
  initialStartDate = "",
  initialEndDate = "",
}: ExpensesTableProps) {
  const router = useRouter()

  // Filter states
  const [search, setSearch] = useState(initialSearch)
  const [expenseNameFilter, setExpenseNameFilter] = useState(initialExpenseNameId)
  const [groupFilter, setGroupFilter] = useState(initialGroupId)
  const [startDate, setStartDate] = useState(initialStartDate)
  const [endDate, setEndDate] = useState(initialEndDate)

  // Dialog states
  const [viewExpense, setViewExpense] = useState<Expense | null>(null)
  const [deleteCandidate, setDeleteCandidate] = useState<Expense | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleApplyFilters = () => {
    const params = new URLSearchParams()
    if (search) params.set("search", search)
    if (expenseNameFilter) params.set("expenseNameId", expenseNameFilter)
    if (groupFilter) params.set("groupId", groupFilter)
    if (startDate) params.set("startDate", startDate)
    if (endDate) params.set("endDate", endDate)
    params.set("page", "1")
    router.push(`/expenses/manage?${params.toString()}`)
  }

  const handleResetFilters = () => {
    setSearch("")
    setExpenseNameFilter("")
    setGroupFilter("")
    setStartDate("")
    setEndDate("")
    router.push("/expenses/manage")
  }

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams()
    if (search) params.set("search", search)
    if (expenseNameFilter) params.set("expenseNameId", expenseNameFilter)
    if (groupFilter) params.set("groupId", groupFilter)
    if (startDate) params.set("startDate", startDate)
    if (endDate) params.set("endDate", endDate)
    params.set("page", String(newPage))
    router.push(`/expenses/manage?${params.toString()}`)
  }

  const confirmDelete = async () => {
    if (!deleteCandidate) return
    setIsDeleting(true)
    try {
      const res = await deleteExpense(deleteCandidate.id)
      if (res.success) {
        toast.success("Expense record deleted successfully.")
        setDeleteCandidate(null)
        router.refresh()
      } else {
        toast.error(res.error || "Failed to delete expense.")
      }
    } catch (err: any) {
      toast.error(err?.message || "An unexpected error occurred.")
    } finally {
      setIsDeleting(false)
    }
  }

  const hasActiveFilters = Boolean(search || expenseNameFilter || groupFilter || startDate || endDate)

  return (
    <div className="space-y-4">
      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-surface-900">Manage Expenses</h2>
          <p className="text-sm text-surface-500 mt-0.5">
            View, filter, edit, and audit actual Foundation operational expense transactions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/expenses/reports">
            <Button variant="outline" size="sm" className="gap-2 border-surface-300 text-surface-700 hover:bg-surface-50">
              Expense Report
            </Button>
          </Link>
          <Link href="/expenses/new">
            <Button size="sm" className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm">
              <Plus className="w-4 h-4" />
              Add Expense
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="shadow-sm border-surface-200 bg-white">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            {/* Search */}
            <div className="relative lg:col-span-2">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
              <Input
                placeholder="Search by expense name, ID, or note..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleApplyFilters()}
                className="pl-9 h-9 text-sm border-surface-300 focus-visible:ring-emerald-500 focus-visible:border-emerald-500"
              />
            </div>

            {/* Group Filter */}
            <div>
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

            {/* Start Date */}
            <div>
              <Input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                placeholder="From Date"
                className="h-9 text-sm border-surface-300"
              />
            </div>

            {/* End Date */}
            <div>
              <Input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                placeholder="To Date"
                className="h-9 text-sm border-surface-300"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-3 pt-3 border-t border-surface-100">
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={handleApplyFilters} className="h-8 gap-1.5 bg-surface-900 text-white hover:bg-surface-800">
                <Filter className="w-3.5 h-3.5" />
                Apply Filters
              </Button>
              {hasActiveFilters && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleResetFilters}
                  className="h-8 gap-1 text-surface-600 hover:text-surface-900"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset
                </Button>
              )}
            </div>

            <div className="flex items-center gap-3 text-xs sm:text-sm font-medium text-surface-600">
              <span>
                Total Records: <strong className="text-surface-900">{total}</strong>
              </span>
              <span className="hidden sm:inline text-surface-300">|</span>
              <span className="bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-md border border-emerald-200/60 font-semibold">
                Total Amount: ৳{formatCurrency(totalAmount)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Table */}
      <Card className="shadow-sm border-surface-200 bg-white overflow-hidden">
        <CardContent className="p-0">
          {initialExpenses.length === 0 ? (
            <div className="py-16 text-center text-surface-500">
              <Receipt className="w-12 h-12 mx-auto mb-3 text-surface-300 stroke-[1.5]" />
              <p className="font-semibold text-base text-surface-800">
                {hasActiveFilters ? "No matching expenses found." : "No expenses recorded yet."}
              </p>
              <p className="text-sm text-surface-500 mt-1 max-w-sm mx-auto">
                {hasActiveFilters
                  ? "Try adjusting your search query, group, or date range filters."
                  : "Click 'Add Expense' to record your first operational expense."}
              </p>
              {!hasActiveFilters && (
                <div className="mt-4">
                  <Link href="/expenses/new">
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-medium">
                      <Plus className="w-4 h-4" />
                      Add Expense
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-50/80 border-b border-surface-200 text-surface-600 font-semibold">
                  <tr>
                    <th className="py-3.5 px-4 w-12 text-center">SL</th>
                    <th className="py-3.5 px-4 w-28">Expense ID</th>
                    <th className="py-3.5 px-4">Expense Name</th>
                    <th className="py-3.5 px-4">Group</th>
                    <th className="py-3.5 px-4">Amount</th>
                    <th className="py-3.5 px-4 w-32">Date</th>
                    <th className="py-3.5 px-4">Note</th>
                    <th className="py-3.5 px-4">Created By</th>
                    <th className="py-3.5 px-4 w-28 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100">
                  {initialExpenses.map((expense, idx) => {
                    const displayExpenseId =
                      expense.expenseId || `EXP-${expense.id.slice(0, 6).toUpperCase()}`
                    const slNo = (currentPage - 1) * pageSize + idx + 1
                    const noteText = expense.note || expense.comment

                    return (
                      <tr key={expense.id} className="hover:bg-surface-50/60 transition-colors">
                        {/* SL */}
                        <td className="py-3.5 px-4 text-center text-xs font-medium text-surface-500">
                          {slNo}
                        </td>

                        {/* Expense ID */}
                        <td className="py-3.5 px-4 font-mono text-xs font-semibold text-surface-800 whitespace-nowrap">
                          <span className="bg-surface-100 text-surface-800 px-2 py-0.5 rounded border border-surface-200">
                            {displayExpenseId}
                          </span>
                        </td>

                        {/* Expense Name */}
                        <td className="py-3.5 px-4 font-semibold text-surface-900">
                          <div className="flex items-center gap-2">
                            <span>{expense.resolvedExpenseName}</span>
                            {expense.customName && !expense.expenseNameId && (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-normal">
                                Custom
                              </Badge>
                            )}
                          </div>
                        </td>

                        {/* Group */}
                        <td className="py-3.5 px-4 text-surface-700 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 font-medium">
                            <Building2 className="w-3.5 h-3.5 text-surface-400" />
                            <span>{expense.groupName || expense.group?.name || "—"}</span>
                          </div>
                        </td>

                        {/* Amount */}
                        <td className="py-3.5 px-4 font-bold text-surface-950 whitespace-nowrap">
                          ৳{formatCurrency(expense.amount)}
                        </td>

                        {/* Date */}
                        <td className="py-3.5 px-4 text-surface-700 whitespace-nowrap text-xs">
                          <div className="flex items-center gap-1.5 font-medium">
                            <Calendar className="w-3.5 h-3.5 text-surface-400" />
                            {formatDate(expense.expenseDate)}
                          </div>
                        </td>

                        {/* Note */}
                        <td className="py-3.5 px-4 text-surface-600 max-w-[200px] truncate text-xs">
                          {noteText || <span className="text-surface-400 italic font-light">—</span>}
                        </td>

                        {/* Created By */}
                        <td className="py-3.5 px-4 text-surface-600 text-xs">
                          {expense.creatorName || <span className="text-surface-400 italic font-light">System</span>}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-surface-500 hover:text-surface-900"
                              onClick={() => setViewExpense(expense)}
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Link href={`/expenses/${expense.id}/edit`}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-surface-500 hover:text-surface-900"
                                title="Edit Expense"
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => setDeleteCandidate(expense)}
                              title="Delete Expense"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-surface-200 bg-surface-50/50 text-sm">
              <span className="text-surface-600 text-xs">
                Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, total)} of {total} records
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                  className="h-8 text-xs border-surface-300"
                >
                  Previous
                </Button>
                <div className="px-2 text-xs font-medium text-surface-700">
                  Page {currentPage} of {totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                  className="h-8 text-xs border-surface-300"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Expense Modal */}
      <Dialog open={Boolean(viewExpense)} onOpenChange={open => !open && setViewExpense(null)}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-surface-900">
              <Receipt className="w-5 h-5 text-emerald-600" />
              Expense Details
            </DialogTitle>
            <DialogDescription className="text-surface-500 text-sm">
              Financial transaction details for this operational expense.
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
                  <span className="font-medium text-surface-900">{formatDate(viewExpense.expenseDate)}</span>
                </div>
              </div>

              <div className="space-y-2 border-t pt-2 border-surface-100">
                <div className="flex justify-between py-1 border-b border-surface-100">
                  <span className="text-surface-500">Expense Name:</span>
                  <span className="font-semibold text-surface-900">{viewExpense.resolvedExpenseName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-surface-100">
                  <span className="text-surface-500">Funding Group:</span>
                  <span className="font-medium text-surface-800">
                    {viewExpense.groupName || viewExpense.group?.name || "—"}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-surface-100">
                  <span className="text-surface-500">Amount:</span>
                  <span className="font-bold text-base text-emerald-700">
                    ৳{formatCurrency(viewExpense.amount)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-surface-100">
                  <span className="text-surface-500">Recorded By:</span>
                  <span className="text-surface-800">{viewExpense.creatorName || "System"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-surface-100">
                  <span className="text-surface-500">Created At:</span>
                  <span className="text-surface-800 text-xs">{formatDateTime(viewExpense.createdAt)}</span>
                </div>
                {viewExpense.ledgerTransactionId && (
                  <div className="flex justify-between py-1 border-b border-surface-100">
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
              className="border-surface-300 text-surface-700 hover:bg-surface-50"
            >
              Close
            </Button>
            {viewExpense && (
              <Link href={`/expenses/${viewExpense.id}/edit`}>
                <Button size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium">
                  <Pencil className="w-3.5 h-3.5" />
                  Edit Expense
                </Button>
              </Link>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={Boolean(deleteCandidate)} onOpenChange={open => !open && setDeleteCandidate(null)}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-2">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <DialogTitle className="text-surface-900">Confirm Expense Deletion</DialogTitle>
            <DialogDescription className="text-surface-600 text-sm">
              Are you sure you want to delete this expense of{" "}
              <strong className="text-surface-900">৳{deleteCandidate ? formatCurrency(deleteCandidate.amount) : 0}</strong> for{" "}
              <strong className="text-surface-900">{deleteCandidate?.resolvedExpenseName}</strong>?
              <br /><br />
              This will reverse the financial ledger deduction and restore the funds to the Group.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button
              variant="outline"
              size="sm"
              disabled={isDeleting}
              onClick={() => setDeleteCandidate(null)}
              className="border-surface-300 text-surface-700 hover:bg-surface-50"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={isDeleting}
              onClick={confirmDelete}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Expense"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ExpensesTable
