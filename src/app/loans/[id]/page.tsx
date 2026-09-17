import { getNow } from "@/lib/date";
import { getLoan } from "@/features/loans/actions"
import { getDocumentsByEntity } from "@/features/documents/actions"
import { notFound } from "next/navigation"
import { formatDate } from "@/lib/format"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, FileText } from "lucide-react"
import Link from "next/link"
import { LoanProfileActions } from "@/features/loans/components/loan-profile-actions"

export default async function LoanDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const loan = await getLoan(resolvedParams.id)
  
  if (!loan) return notFound()

  const documents = await getDocumentsByEntity("LOAN", loan.id)

  // Due logic
  const today = getNow()
  today.setHours(0, 0, 0, 0)
  
  let dueStatus = "No Due"
  
  if (loan.status === "COMPLETED" || loan.remainingBalance <= 0) {
    dueStatus = "Completed"
  } else if (loan.nextDueDate) {
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/loans" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Qard Hasan Details</h1>
        </div>
        <div className="flex items-center gap-2">
          <LoanProfileActions loan={loan} outstanding={loan.remainingBalance} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Qard Hasan Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b"><td className="py-2 w-1/3 text-muted-foreground font-medium">Qard Hasan No</td><td className="py-2 font-medium">{loan.loanNumber}</td></tr>
                  <tr className="border-b"><td className="py-2 text-muted-foreground font-medium">Amount</td><td className="py-2 font-bold text-lg">৳{loan.amount}</td></tr>
                  <tr className="border-b"><td className="py-2 text-muted-foreground font-medium">Status</td>
                    <td className="py-2">
                      <Badge variant={loan.status === "ACTIVE" ? "default" : loan.status === "COMPLETED" ? "secondary" : "destructive"}>
                        {loan.status}
                      </Badge>
                    </td>
                  </tr>
                  <tr className="border-b"><td className="py-2 text-muted-foreground font-medium">Application Date</td><td className="py-2">{formatDate(loan.requestedDate)}</td></tr>
                  <tr className="border-b"><td className="py-2 text-muted-foreground font-medium">Disbursement Date</td><td className="py-2">{loan.disbursedDate ? formatDate(loan.disbursedDate) : "N/A"}</td></tr>
                  <tr className="border-b"><td className="py-2 text-muted-foreground font-medium">Qard Hasan Type</td><td className="py-2">{loan.loanType === "BUSINESS" ? `Business (${loan.businessType})` : "Other"}</td></tr>
                  <tr><td className="py-2 text-muted-foreground font-medium">Qard Hasan Purpose</td><td className="py-2">{loan.purpose}</td></tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Due Status</CardTitle>
          </CardHeader>
          <CardContent>
             <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b"><td className="py-2 w-1/3 text-muted-foreground font-medium">Total Recovered</td><td className="py-2 text-green-600 font-bold">৳{loan.totalPaidAmount}</td></tr>
                  <tr className="border-b"><td className="py-2 text-muted-foreground font-medium">Remaining Balance</td><td className="py-2 text-red-600 font-bold">৳{loan.remainingBalance}</td></tr>
                  <tr className="border-b"><td className="py-2 text-muted-foreground font-medium">First Installment Date</td><td className="py-2">{loan.nextDueDate ? formatDate(loan.nextDueDate) : '-'}</td></tr>
                  <tr><td className="py-2 text-muted-foreground font-medium">Due Status</td>
                    <td className="py-2">
                      <Badge variant={dueStatus === "Due Today" ? "default" : dueStatus === "Overdue" ? "destructive" : dueStatus === "Completed" ? "secondary" : "outline"}>
                        {dueStatus}
                      </Badge>
                    </td>
                  </tr>
                </tbody>
             </table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Beneficiary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b"><td className="py-2 w-1/3 text-muted-foreground font-medium">Name</td><td className="py-2">{loan.beneficiary?.fullName || 'Name not found'}</td></tr>
                  <tr className="border-b"><td className="py-2 text-muted-foreground font-medium">Beneficiary ID</td><td className="py-2">{loan.beneficiary?.beneficiaryId || '-'}</td></tr>
                  <tr className="border-b"><td className="py-2 text-muted-foreground font-medium">Phone</td><td className="py-2">{loan.beneficiary?.phone || '-'}</td></tr>
                  <tr className="border-b"><td className="py-2 text-muted-foreground font-medium">National ID</td><td className="py-2">{loan.beneficiary?.nationalId || '-'}</td></tr>
                  <tr className="border-b"><td className="py-2 text-muted-foreground font-medium">Address</td><td className="py-2">{loan.beneficiary?.address || '-'}</td></tr>
                  <tr><td className="py-2 text-muted-foreground font-medium">Occupation</td><td className="py-2">{loan.beneficiary?.occupation || '-'}</td></tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        
        {loan.allocations && loan.allocations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Funding Source</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {(loan.allocations || []).map((a: any) => (
                  <div key={a.id} className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground">{a.fund?.group?.name || "General Fund"} ({a.fund?.name || ""})</span>
                    <span className="font-medium">৳{a.amount}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Card id="history">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Repayment History</CardTitle>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/loans/ledger?loanId=${loan.id}`}>
              <FileText className="mr-2 h-4 w-4" /> View Ledger</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {loan.repayments.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm">
              No repayments recorded yet.</div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="pb-2 font-medium">Date</th>
                  <th className="pb-2 font-medium">Transaction ID</th>
                  <th className="pb-2 font-medium text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {(loan.repayments || []).map((r: any) => (
                  <tr key={r.id} className="border-b last:border-0">
                    <td className="py-3">{formatDate(r.date)}</td>
                    <td className="py-3 text-muted-foreground text-xs">{r.ledgerTransactionId}</td>
                    <td className="py-3 text-right font-medium text-green-600">৳{r.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
