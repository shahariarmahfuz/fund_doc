import { notFound } from "next/navigation"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { Metadata } from "next"

import { getExpense, getExpenseNames } from "@/features/expenses/actions"
import { getGroups } from "@/features/groups/actions"
import { ExpenseForm } from "@/features/expenses/components/expense-form"

export const metadata: Metadata = {
  title: "Edit Expense | Foundation",
}

export const dynamic = "force-dynamic"

interface EditExpensePageProps {
  params: Promise<{
    id: string
  }>
}

export default async function EditExpensePage({ params }: EditExpensePageProps) {
  const { id } = await params

  const [expense, expenseNames, allGroups] = await Promise.all([
    getExpense(id),
    getExpenseNames(true),
    getGroups(),
  ])

  if (!expense) {
    notFound()
  }

  const activeGroups = allGroups.filter(g => g.status === "ACTIVE" || !g.status || g.id === expense.groupId)

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
        <span className="font-medium text-surface-900">Edit Expense</span>
      </div>

      <ExpenseForm
        expenseNames={expenseNames}
        groups={activeGroups}
        initialExpense={expense}
        isEdit={true}
      />
    </div>
  )
}
