import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { Metadata } from "next"

import { getExpenseNames } from "@/features/expenses/actions"
import { ExpenseNamesTable } from "@/features/expenses/components/expense-names-table"

export const metadata: Metadata = {
  title: "Manage Expense Names | Foundation",
}

export const dynamic = "force-dynamic"

export default async function ManageExpenseNamesPage() {
  const expenseNames = await getExpenseNames(false)

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
        <span className="font-medium text-surface-900">Manage Expense Names</span>
      </div>

      <ExpenseNamesTable initialExpenseNames={expenseNames} />
    </div>
  )
}
