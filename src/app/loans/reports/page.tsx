import { getNow } from "@/lib/date";
import { formatCurrency } from "@/lib/format"
import { apiClient } from "@/lib/api/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { PrintButton } from "@/components/shared/print-button"

export default async function LoanReportsPage() {
  let loans: any[] = []
  try {
    loans = await apiClient.loans.getAll() || []
  } catch (err) {
    console.error("Error fetching loans for reports:", err)
  }

  const totalLoans = loans.length
  const activeLoans = loans.filter(l => l.status === "ACTIVE").length
  const completedLoans = loans.filter(l => l.status === "COMPLETED").length
  const defaultedLoans = loans.filter(l => l.status === "DEFAULTED").length

  const totalAmount = loans.reduce((s, l) => s + l.amount, 0)
  const totalRepaid = loans.reduce((s, l) => s + l.totalPaidAmount, 0)
  const totalOutstanding = loans.reduce((s, l) => s + l.remainingBalance, 0)

  const repaymentPercentage = totalAmount > 0 ? (totalRepaid / totalAmount) * 100 : 0
  
  const today = getNow()
  today.setHours(0, 0, 0, 0)
  
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

  const allRepayments = loans.flatMap(l => l.repayments)
  const todaysCollection = allRepayments
    .filter(r => { const d = new Date(r.date); d.setHours(0,0,0,0); return d.getTime() === today.getTime() })
    .reduce((s, r) => s + r.amount, 0)
    
  const monthlyCollection = allRepayments
    .filter(r => new Date(r.date) >= firstDayOfMonth)
    .reduce((s, r) => s + r.amount, 0)

  return (
    <div className="flex flex-col h-full">

      <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-5xl space-y-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Qard Hasan Reports</h1>
            <p className="text-muted-foreground">
              Overview of Qard Hasan performance, outstanding balances, and completion rates.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Qard Hasan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalLoans}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Active Qard Hasan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeLoans}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{completedLoans}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Defaulted</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{defaultedLoans}</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Financial Summary</CardTitle>
                <CardDescription>Total disbursed vs repaid</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total Disbursed</span>
                  <span className="text-lg font-semibold">৳{formatCurrency(totalAmount)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total Repaid</span>
                  <span className="text-lg font-semibold text-green-600">৳{formatCurrency(totalRepaid)}</span>
                </div>
                <div className="flex justify-between items-center border-t pt-2">
                  <span className="font-semibold">Outstanding Balance</span>
                  <span className="text-lg font-bold text-destructive">৳{formatCurrency(totalOutstanding)}</span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Repayment Rate</span>
                    <span>{repaymentPercentage.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2.5"><div className="bg-primary h-2.5 rounded-full" style={{ width: `${repaymentPercentage}%` }}></div></div>
                </div>
                
                <div className="flex justify-between items-center text-sm pt-4 border-t">
                  <span className="text-muted-foreground">Today's Collection</span>
                  <span className="font-semibold text-emerald-600">৳{formatCurrency(todaysCollection)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">This Month's Collection</span>
                  <span className="font-semibold text-emerald-600">৳{formatCurrency(monthlyCollection)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest Qard Hasan and payments</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  View detailed activity in the Ledger and Repayments tabs.
                </p>
                <div className="mt-4 flex gap-2">
                  <PrintButton />
                </div>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </div>
  )
}
