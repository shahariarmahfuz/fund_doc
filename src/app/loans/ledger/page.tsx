import { apiClient } from "@/lib/api/client"
import { LoanLedgerTable } from "@/features/loans/components/loan-ledger-table"

export default async function LoanLedgerPage({ searchParams }: { searchParams: Promise<{ loanId?: string }> }) {
  const resolvedParams = await searchParams
  const { loanId } = resolvedParams

  let loanNumberFilter: string | undefined = undefined
  let specificLoan: any = null

  if (loanId) {
    try {
      specificLoan = await apiClient.loans.getById(loanId)
      if (specificLoan) {
        loanNumberFilter = specificLoan.loanNumber
      }
    } catch (err) {
      console.error("Error fetching loan:", err)
    }
  }

  let transactions: any[] = []
  let loans: any[] = []
  try {
    const [txs, allLoans] = await Promise.all([
      apiClient.ledger.getTransactions({ type: "LOAN,REPAYMENT" }),
      apiClient.loans.getAll()
    ])
    transactions = txs || []
    loans = allLoans || []
  } catch (err) {
    console.error("Error fetching loans ledger data:", err)
  }

  if (loanNumberFilter) {
    transactions = transactions.filter(t => t.referenceId === loanNumberFilter)
  }

  transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const loanMap = new Map(loans.map(l => [l.loanNumber, l]))

  let runningBalance = 0
  const enhancedTransactions = []
  for (const t of transactions) {
    const loan = loanMap.get(t.referenceId || "")
    const beneficiaryName = loan?.beneficiary?.fullName || "Unknown"

    let debit = 0
    let credit = 0

    if (t.type === "LOAN") {
      debit = t.entries.filter((e: any) => e.isCredit).reduce((sum: number, e: any) => sum + e.amount, 0)
    } else if (t.type === "REPAYMENT") {
      credit = t.entries.filter((e: any) => !e.isCredit).reduce((sum: number, e: any) => sum + e.amount, 0)
    }

    runningBalance += debit
    runningBalance -= credit

    enhancedTransactions.push({
      ...t,
      beneficiaryName,
      debit,
      credit,
      balance: runningBalance
    })
  }

  enhancedTransactions.reverse()

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Qard Hasan Ledger{specificLoan ? ` - ${specificLoan.loanNumber}` : ""}</h1>
              <p className="text-muted-foreground">
                {specificLoan ? `Ledger for ${specificLoan.beneficiary?.fullName}. Total Qard Hasan: ৳${specificLoan.amount}, Remaining: ৳${specificLoan.remainingBalance}` : "View all Qard Hasan disbursement and repayment ledger transactions."}
              </p>
            </div>
          </div>
          <LoanLedgerTable transactions={enhancedTransactions} />
        </div>
      </div>
    </div>
  )
}
