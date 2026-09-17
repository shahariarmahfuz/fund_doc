import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { Metadata } from "next"

import { getExpenseLedger, getExpenseNames } from "@/features/expenses/actions"
import { getGroups } from "@/features/groups/actions"
import { ExpenseLedgerView } from "@/features/expenses/components/expense-ledger-view"

export const metadata: Metadata = {
  title: "Expense Ledger | Foundation",
}

export const dynamic = "force-dynamic"

interface ExpenseLedgerPageProps {
  searchParams: Promise<{
    startDate?: string
    endDate?: string
    expenseNameId?: string
    groupId?: string
    search?: string
    page?: string
  }>
}

export default async function ExpenseLedgerPage({ searchParams }: ExpenseLedgerPageProps) {
  const sp = await searchParams
  const startDate = sp.startDate || ""
  const endDate = sp.endDate || ""
  const expenseNameId = sp.expenseNameId || ""
  const groupId = sp.groupId || ""
  const search = sp.search || ""
  const page = parseInt(sp.page || "1", 10) || 1

  const [ledgerData, expenseNames, groups] = await Promise.all([
    getExpenseLedger({
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      expenseNameId: expenseNameId || undefined,
      groupId: groupId || undefined,
      search: search || undefined,
      page,
      pageSize: 50,
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
        <Link href="/expenses/manage" className="hover:text-surface-900 transition-colors">
          Expenses
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="font-medium text-surface-900">Expense Ledger</span>
      </div>

      <ExpenseLedgerView
        ledgerData={ledgerData}
        expenseNames={expenseNames}
        groups={groups}
        initialStartDate={startDate}
        initialEndDate={endDate}
        initialExpenseNameId={expenseNameId}
        initialGroupId={groupId}
        initialSearch={search}
        currentPage={page}
      />
    </div>
  )
}
