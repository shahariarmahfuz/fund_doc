import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { Metadata } from "next"

import ExpenseNameForm from "@/features/expenses/components/expense-name-form"

export const metadata: Metadata = {
  title: "Add Expense Name | Foundation",
}

export const dynamic = "force-dynamic"

export default async function AddExpenseNamePage() {
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Breadcrumbs */}
      <div className="flex items-center space-x-2 text-sm text-surface-500">
        <Link href="/dashboard" className="hover:text-surface-900 transition-colors">
          Financial Activities
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link href="/expenses/names/manage" className="hover:text-surface-900 transition-colors">
          Expenses
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="font-medium text-surface-900">Add Expense Name</span>
      </div>

      <ExpenseNameForm />
    </div>
  )
}
