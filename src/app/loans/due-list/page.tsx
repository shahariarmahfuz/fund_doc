import { getNow } from "@/lib/date";
import { getLoans } from "@/features/loans/actions"
import { DueListTable } from "@/features/loans/components/due-list-table"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"

export default async function LoanDueListPage() {
  const rawLoans = await getLoans()

  // Augment loans with due logic
  const today = getNow()
  today.setHours(0, 0, 0, 0)
  
  const loans = rawLoans
    .filter(loan => loan.remainingBalance > 0 && loan.status !== "COMPLETED")
    .map(loan => {
      let dueStatus = "No Due"
      
      if (loan.nextDueDate) {
        const nextDue = new Date(loan.nextDueDate)
        nextDue.setHours(0, 0, 0, 0)
        
        if (nextDue < today) {
          dueStatus = "Overdue"
        } else if (nextDue.getTime() === today.getTime()) {
          dueStatus = "Due Today"
        } else {
          dueStatus = "Upcoming Due"
        }
      }
      
      return {
        ...loan,
        totalRepaid: loan.totalPaidAmount,
        outstanding: loan.remainingBalance,
        dueStatus,
      }
    })

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Qard Hasan Due List</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Track overdue and upcoming Qard Hasan installments
          </p>
        </div>
        <Button asChild>
          <Link href="/loans/new">
            <Plus className="mr-2 h-4 w-4" />
            New Qard Hasan
          </Link>
        </Button>
      </div>

      <DueListTable data={loans} />
    </div>
  )
}
