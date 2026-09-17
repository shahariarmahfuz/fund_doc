import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { Metadata } from "next"

import { getExpenseReport, getExpenseNames } from "@/features/expenses/actions"
import { getGroups } from "@/features/groups/actions"
import { ExpenseReportView } from "@/features/expenses/components/expense-report-view"

export const metadata: Metadata = {
  title: "Expense Report | Foundation",
}

export const dynamic = "force-dynamic"

interface ExpenseReportPageProps {
  searchParams: Promise<{
    startDate?: string
    endDate?: string
    fromDate?: string
    toDate?: string
    expenseNameId?: string
    groupId?: string
  }>
}

export default async function ExpenseReportPage({ searchParams }: ExpenseReportPageProps) {
  const sp = await searchParams
  const fromDate = sp.fromDate || sp.startDate || ""
  const toDate = sp.toDate || sp.endDate || ""
  const expenseNameId = sp.expenseNameId || ""
  const groupId = sp.groupId || ""

  const [reportData, expenseNames, groups] = await Promise.all([
    getExpenseReport({
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
      expenseNameId: expenseNameId || undefined,
      groupId: groupId || undefined,
    }),
    getExpenseNames(false),
    getGroups(),
  ])

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <div className="flex items-center space-x-2 text-sm text-surface-500 no-print hide-print">
        <Link href="/dashboard" className="hover:text-surface-900 transition-colors">
          Financial Activities
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link href="/expenses/manage" className="hover:text-surface-900 transition-colors">
          Expenses
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="font-medium text-surface-900">Expense Report</span>
      </div>

      <ExpenseReportView
        reportData={reportData}
        expenseNames={expenseNames}
        groups={groups}
        initialStartDate={fromDate}
        initialEndDate={toDate}
        initialExpenseNameId={expenseNameId}
        initialGroupId={groupId}
      />
    </div>
  )
}
