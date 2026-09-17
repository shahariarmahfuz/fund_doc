import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { Metadata } from "next"

import { getExpenseNames } from "@/features/expenses/actions"
import { getGroups } from "@/features/groups/actions"
import { ExpenseForm } from "@/features/expenses/components/expense-form"

export const metadata: Metadata = {
  title: "Add Expense | Foundation",
}

export const dynamic = "force-dynamic"

export default async function AddExpensePage() {
  const [expenseNames, allGroups] = await Promise.all([
    getExpenseNames(true),
    getGroups(),
  ])

  const activeGroups = allGroups.filter(g => g.status === "ACTIVE" || !g.status)

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
        <span className="font-medium text-surface-900">Add Expense</span>
      </div>

      <ExpenseForm expenseNames={expenseNames} groups={activeGroups} />
    </div>
  )
}
