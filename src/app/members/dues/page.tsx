import { getNow } from "@/lib/date";
import { formatCurrency } from "@/lib/format"
import { getMemberDuesList } from "@/features/members/due-actions"
import { apiClient } from "@/lib/api/client"
import { MemberDuesTable } from "@/features/members/components/member-dues-table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, AlertCircle, TrendingUp, Wallet, Banknote } from "lucide-react"

export default async function MemberDuesPage() {
  const dues = await getMemberDuesList()

  const totalMembers = dues.length
  const membersWithDue = dues.filter(m => m.currentDue > 0).length
  const totalOutstanding = dues.reduce((acc, m) => acc + m.currentDue, 0)
  const totalAdvanceBalance = dues.reduce((acc, m) => acc + m.advanceBalance, 0)
  
  let collectedThisMonth = 0
  try {
    const summary = await apiClient.contributions.getSummary()
    collectedThisMonth = summary?.collectedThisMonth || 0
  } catch (err) {
    console.error("Error fetching contributions summary:", err)
  }

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold tracking-tight">Member Dues</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMembers}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Members in Due</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{membersWithDue}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Outstanding Due</CardTitle>
            <TrendingUp className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">৳{formatCurrency(totalOutstanding)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Advance Balance</CardTitle>
            <Wallet className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">৳{formatCurrency(totalAdvanceBalance)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collected This Month</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">৳{formatCurrency(collectedThisMonth)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <MemberDuesTable data={dues} />
      </div>
    </div>
  )
}
