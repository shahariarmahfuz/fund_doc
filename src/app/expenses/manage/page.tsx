import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { Metadata } from "next"

import { getExpenses, getExpenseNames } from "@/features/expenses/actions"
import { getGroups } from "@/features/groups/actions"
import { ExpensesTable } from "@/features/expenses/components/expenses-table"

export const metadata: Metadata = {
  title: "Manage Expenses | Foundation",
}

export const dynamic = "force-dynamic"

interface ManageExpensesPageProps {
  searchParams: Promise<{
    search?: string
    expenseNameId?: string
    groupId?: string
    startDate?: string
    endDate?: string
    page?: string
  }>
}

export default async function ManageExpensesPage({ searchParams }: ManageExpensesPageProps) {
  const sp = await searchParams
  const search = sp.search || ""
  const expenseNameId = sp.expenseNameId || ""
  const groupId = sp.groupId || ""
  const startDate = sp.startDate || ""
  const endDate = sp.endDate || ""
  const page = parseInt(sp.page || "1", 10) || 1

  const [expenseData, expenseNames, groups] = await Promise.all([
    getExpenses({
      search: search || undefined,
      expenseNameId: expenseNameId || undefined,
      groupId: groupId || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      page,
      pageSize: 10,
    }),
    getExpenseNames(false),
    getGroups(),
  ])

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <div className="flex items-center space-x-2 text-sm text-surface-500">
        <Link href="/dashboard" className="hover:text-surface-900 transition-colors">
          Financial Activities
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="font-medium text-surface-900">Expenses</span>
        <ChevronRight className="h-4 w-4" />
        <span className="font-medium text-surface-900">Manage Expenses</span>
      </div>

      <ExpensesTable
        initialExpenses={expenseData.items}
        total={expenseData.total}
        totalAmount={expenseData.totalAmount}
        currentPage={expenseData.page}
        pageSize={expenseData.pageSize}
        totalPages={expenseData.totalPages}
        expenseNames={expenseNames}
        groups={groups}
        initialSearch={search}
        initialExpenseNameId={expenseNameId}
        initialGroupId={groupId}
        initialStartDate={startDate}
        initialEndDate={endDate}
      />
    </div>
  )
}
