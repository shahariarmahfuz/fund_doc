"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Search,
  Plus,
  Tag,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
  Calendar,
  RotateCcw,
  Power,
  AlertTriangle,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { formatDate } from "@/lib/format"
import { updateExpenseName, deleteExpenseName } from "../actions"
import type { ExpenseName } from "@/types/models"

interface ExpenseNamesTableProps {
  initialExpenseNames: ExpenseName[]
}

export function ExpenseNamesTable({ initialExpenseNames }: ExpenseNamesTableProps) {
  const router = useRouter()
  const [expenseNames, setExpenseNames] = useState<ExpenseName[]>(initialExpenseNames)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL")

  // Toggle state
  const [togglingId, setTogglingId] = useState<string | null>(null)

  // Edit dialog state
  const [editingItem, setEditingItem] = useState<ExpenseName | null>(null)
  const [editName, setEditName] = useState("")
  const [editNote, setEditNote] = useState("")
  const [isSavingEdit, setIsSavingEdit] = useState(false)

  // Delete dialog state
  const [deletingItem, setDeletingItem] = useState<ExpenseName | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Filtered expense names
  const filteredItems = useMemo(() => {
    return expenseNames.filter(item => {
      const matchesSearch =
        search === "" ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        (item.note && item.note.toLowerCase().includes(search.toLowerCase()))

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && item.isActive) ||
        (statusFilter === "INACTIVE" && !item.isActive)

      return matchesSearch && matchesStatus
    })
  }, [expenseNames, search, statusFilter])

  // Toggle active / inactive
  const handleToggleStatus = async (item: ExpenseName) => {
    setTogglingId(item.id)
    const newStatus = !item.isActive
    try {
      const res = await updateExpenseName(item.id, { isActive: newStatus })
      if (res.success) {
        setExpenseNames(prev =>
          prev.map(n => (n.id === item.id ? { ...n, isActive: newStatus } : n))
        )
        toast.success(`"${item.name}" is now ${newStatus ? "Active" : "Inactive"}.`)
        router.refresh()
      } else {
        toast.error(res.error || "Failed to update status.")
      }
    } catch (err: any) {
      toast.error(err?.message || "An unexpected error occurred.")
    } finally {
      setTogglingId(null)
    }
  }

  // Open edit modal
  const handleOpenEdit = (item: ExpenseName) => {
    setEditingItem(item)
    setEditName(item.name)
    setEditNote(item.note || "")
  }

  // Save edit
  const handleSaveEdit = async () => {
    if (!editingItem) return
    const trimmedName = editName.trim()
    if (!trimmedName) {
      toast.error("Expense name cannot be empty.")
      return
    }

    setIsSavingEdit(true)
    try {
      const res = await updateExpenseName(editingItem.id, {
        name: trimmedName,
        note: editNote.trim() || undefined,
      })
      if (res.success && res.data) {
        setExpenseNames(prev =>
          prev.map(n =>
            n.id === editingItem.id
              ? { ...n, name: trimmedName, note: editNote.trim() || null }
              : n
          )
        )
        toast.success("Expense name updated successfully.")
        setEditingItem(null)
        router.refresh()
      } else {
        toast.error(res.error || "Failed to update expense name.")
      }
    } catch (err: any) {
      toast.error(err?.message || "An unexpected error occurred.")
    } finally {
      setIsSavingEdit(false)
    }
  }

  // Delete expense name
  const handleConfirmDelete = async () => {
    if (!deletingItem) return
    setIsDeleting(true)
    try {
      const res = await deleteExpenseName(deletingItem.id)
      if (res.success) {
        setExpenseNames(prev => prev.filter(n => n.id !== deletingItem.id))
        toast.success(`"${deletingItem.name}" deleted successfully.`)
        setDeletingItem(null)
        router.refresh()
      } else {
        toast.error(res.error || "Failed to delete expense name.")
      }
    } catch (err: any) {
      toast.error(err?.message || "An unexpected error occurred.")
    } finally {
      setIsDeleting(false)
    }
  }

  const hasActiveFilters = Boolean(search || statusFilter !== "ALL")

  return (
    <div className="space-y-4">
      {/* Top Banner & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-surface-900">Manage Expense Names</h2>
          <p className="text-sm text-surface-500 mt-0.5">
            Master list of reusable expense names for Foundation operations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/expenses/names">
            <Button size="sm" className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm font-medium">
              <Plus className="w-4 h-4" />
              Add Expense Name
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <Card className="shadow-sm border-surface-200 bg-white">
        <CardContent className="p-3.5">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1 max-w-xl">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                <Input
                  placeholder="Search expense name or note..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9 h-9 text-sm border-surface-300 focus-visible:ring-emerald-500 focus-visible:border-emerald-500"
                />
              </div>

              {/* Status Filter */}
              <div className="w-full sm:w-36">
                <Select
                  value={statusFilter}
                  onValueChange={val => setStatusFilter(val as any)}
                >
                  <SelectTrigger className="h-9 text-sm border-surface-300">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Status</SelectItem>
                    <SelectItem value="ACTIVE">Active Only</SelectItem>
                    <SelectItem value="INACTIVE">Inactive Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {hasActiveFilters && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setSearch("")
                    setStatusFilter("ALL")
                  }}
                  className="h-9 gap-1 text-surface-600 hover:text-surface-900"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs sm:text-sm text-surface-600 self-end sm:self-center">
              <span>Total:</span>
              <strong className="text-surface-900 font-semibold">{filteredItems.length}</strong>
              <span className="text-surface-400">/</span>
              <span className="text-surface-500">{expenseNames.length} names</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Table */}
      <Card className="shadow-sm border-surface-200 bg-white overflow-hidden">
        <CardContent className="p-0">
          {filteredItems.length === 0 ? (
            <div className="py-16 text-center text-surface-500">
              <Tag className="w-12 h-12 mx-auto mb-3 text-surface-300 stroke-[1.5]" />
              <p className="font-semibold text-base text-surface-800">
                {hasActiveFilters ? "No matching expense names found." : "No expense names recorded yet."}
              </p>
              <p className="text-sm text-surface-500 mt-1 max-w-sm mx-auto">
                {hasActiveFilters
                  ? "Try adjusting your search keywords or status filter."
                  : "Create standard expense names like Office Rent, Utilities, and Supplies."}
              </p>
              {!hasActiveFilters && (
                <div className="mt-4">
                  <Link href="/expenses/names">
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-medium">
                      <Plus className="w-4 h-4" />
                      Add Expense Name
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
                    <th className="py-3 px-4 w-12 text-center">SL</th>
                    <th className="py-3 px-4">Expense Name</th>
                    <th className="py-3 px-4">Note</th>
                    <th className="py-3 px-4 w-28">Status</th>
                    <th className="py-3 px-4 w-32">Created</th>
                    <th className="py-3 px-4 w-44 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100">
                  {filteredItems.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-surface-50/60 transition-colors">
                      {/* SL */}
                      <td className="py-3 px-4 text-center font-medium text-surface-500 text-xs">
                        {idx + 1}
                      </td>

                      {/* Expense Name */}
                      <td className="py-3 px-4 font-semibold text-surface-900">
                        {item.name}
                      </td>

                      {/* Note */}
                      <td className="py-3 px-4 text-surface-600 max-w-xs truncate">
                        {item.note || <span className="text-surface-400 italic font-light">—</span>}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        {item.isActive ? (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1 font-normal text-xs">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 gap-1 font-normal text-xs">
                            <XCircle className="w-3 h-3 text-slate-400" />
                            Inactive
                          </Badge>
                        )}
                      </td>

                      {/* Created */}
                      <td className="py-3 px-4 text-surface-600 text-xs whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-surface-400" />
                          {formatDate(item.createdAt)}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Edit */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEdit(item)}
                            className="h-8 px-2 text-surface-600 hover:text-surface-900 hover:bg-surface-100 text-xs"
                            title="Edit Expense Name"
                          >
                            <Pencil className="w-3.5 h-3.5 mr-1" />
                            Edit
                          </Button>

                          {/* Toggle Active / Inactive */}
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={togglingId === item.id}
                            onClick={() => handleToggleStatus(item)}
                            className={`h-8 px-2 text-xs ${
                              item.isActive
                                ? "text-amber-700 hover:bg-amber-50"
                                : "text-emerald-700 hover:bg-emerald-50"
                            }`}
                            title={item.isActive ? "Deactivate" : "Activate"}
                          >
                            {togglingId === item.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <>
                                <Power className="w-3.5 h-3.5 mr-1" />
                                {item.isActive ? "Deactivate" : "Activate"}
                              </>
                            )}
                          </Button>

                          {/* Delete */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeletingItem(item)}
                            className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50 text-xs"
                            title="Delete Expense Name"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={Boolean(editingItem)} onOpenChange={open => !open && setEditingItem(null)}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-surface-900">
              Edit Expense Name
            </DialogTitle>
            <DialogDescription className="text-surface-500 text-sm">
              Update the name and optional note for this expense category.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-surface-700">
                Expense Name <span className="text-red-500">*</span>
              </label>
              <Input
                value={editName}
                onChange={e => setEditName(e.target.value)}
                placeholder="e.g. Office Rent, Electricity Bill"
                className="h-10 border-surface-300 focus-visible:ring-emerald-500 focus-visible:border-emerald-500"
                disabled={isSavingEdit}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-surface-700">
                Note (Optional)
              </label>
              <Textarea
                value={editNote}
                onChange={e => setEditNote(e.target.value)}
                placeholder="Add a note about this expense..."
                rows={3}
                className="resize-y min-h-[80px] border-surface-300 focus-visible:ring-emerald-500 focus-visible:border-emerald-500"
                disabled={isSavingEdit}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditingItem(null)}
              disabled={isSavingEdit}
              className="border-surface-300 text-surface-700 hover:bg-surface-50"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveEdit}
              disabled={isSavingEdit}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
            >
              {isSavingEdit ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={Boolean(deletingItem)} onOpenChange={open => !open && setDeletingItem(null)}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-2">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <DialogTitle className="text-lg font-semibold text-surface-900">
              Delete Expense Name
            </DialogTitle>
            <DialogDescription className="text-surface-600 text-sm">
              Are you sure you want to delete <strong className="text-surface-900">&ldquo;{deletingItem?.name}&rdquo;</strong>?
              This action cannot be undone. If it is currently used by active expense records, please deactivate it instead.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeletingItem(null)}
              disabled={isDeleting}
              className="border-surface-300 text-surface-700 hover:bg-surface-50"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Expense Name"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ExpenseNamesTable
