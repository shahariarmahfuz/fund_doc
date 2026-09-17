import { apiClient } from "@/lib/api/client"
import { GrantLedgerTable } from "@/features/grants/components/grant-ledger-table"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export default async function GrantLedgerPage({ searchParams }: { searchParams: Promise<{ grantId?: string }> }) {
  const resolvedParams = await searchParams
  const { grantId } = resolvedParams

  let grantNumberFilter: string | undefined = undefined
  let specificGrant: any = null

  if (grantId) {
    try {
      specificGrant = await apiClient.grants.getById(grantId)
      if (specificGrant) {
        grantNumberFilter = specificGrant.grantNumber
      }
    } catch (err) {
      console.error("Error fetching grant:", err)
    }
  }

  let txList: any[] = []
  let grants: any[] = []
  try {
    const [txs, allGrants] = await Promise.all([
      apiClient.ledger.getTransactions({ type: "GRANT" }),
      apiClient.grants.getAll()
    ])
    txList = txs || []
    grants = allGrants || []
  } catch (err) {
    console.error("Error fetching grant ledger data:", err)
  }

  let transactions = txList
  if (grantNumberFilter) {
    transactions = transactions.filter(t => t.referenceId === grantNumberFilter)
  }
  transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const grantMap = new Map(grants.map(g => [g.grantNumber, g]))

  let runningBalance = 0
  const enhancedTransactions = []
  
  // Calculate summary info
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  let totalAmount = 0
  let thisMonthAmount = 0

  for (const t of transactions) {
    const grant = grantMap.get(t.referenceId || "")
    const beneficiaryName = grant?.beneficiary?.fullName || "Unknown"

    let debit = 0
    const credit = 0

    // Grants only debit from the foundation funds
    debit = (t.entries || []).filter((e: any) => e.isCredit).reduce((sum: number, e: any) => sum + e.amount, 0)

    runningBalance += debit
    runningBalance -= credit
    totalAmount += debit
    
    const tDate = new Date(t.date)
    if (tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear) {
      thisMonthAmount += debit
    }

    enhancedTransactions.push({
      ...t,
      beneficiaryName,
      debit,
      credit,
      balance: runningBalance
    })
  }

  // Reverse so newest is on top
  enhancedTransactions.reverse()

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto">
        <div className="space-y-4">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Link href="/dashboard" className="hover:text-primary transition-colors">
              Financial Activities</Link>
            <ChevronRight className="h-4 w-4" />
            <Link href="/grants" className="hover:text-primary transition-colors">
              Sadaqah</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="font-medium text-foreground">Sadaqah Ledger</span>
          </div>

          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Sadaqah Ledger{specificGrant ? ` - ${specificGrant.grantNumber}` : ""}</h1>
              <p className="text-muted-foreground mt-1">
                {specificGrant ? `Ledger for ${specificGrant.beneficiary?.fullName}. Total Sadaqah: ৳${specificGrant.amount}` : "View all Sadaqah disbursement ledger transactions."}
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <Card>
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground font-medium mb-1">Total Sadaqah</div>
                <div className="text-2xl font-bold">{transactions.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground font-medium mb-1">Total Amount</div>
                <div className="text-2xl font-bold text-blue-600">৳{totalAmount.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground font-medium mb-1">Current Balance</div>
                <div className="text-2xl font-bold text-orange-600">৳{runningBalance.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground font-medium mb-1">This Month</div>
                <div className="text-2xl font-bold text-green-600">৳{thisMonthAmount.toLocaleString()}</div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6">
            <GrantLedgerTable transactions={enhancedTransactions} />
          </div>
        </div>
      </div>
    </div>
  )
}
