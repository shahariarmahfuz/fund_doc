import { GroupSelector } from "@/features/groups/components/group-selector"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BarChart3, Download, Printer, FileSpreadsheet, FileText, PieChart } from "lucide-react"

import { getGroupLoanSummary } from "@/features/groups/actions"
import { formatCurrency } from "@/lib/format"

export default async function GroupReportsPage({ searchParams }: { searchParams: Promise<{ groupId?: string }> }) {
  const resolvedParams = await searchParams
  const groupId = resolvedParams.groupId

  let loanSummary = { totalLent: 0, totalOutstanding: 0, activeLoans: 0 }
  if (groupId) {
    loanSummary = await getGroupLoanSummary(groupId)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Group Reports</h1>
          <p className="text-muted-foreground">Comprehensive reporting and analytics for groups.</p>
        </div>
        <div className="flex items-center space-x-4">
          <GroupSelector />
        </div>
      </div>

      {!groupId ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64 space-y-4">
            <BarChart3 className="h-12 w-12 text-muted-foreground" />
            <div className="text-xl font-semibold">No Group Selected</div>
            <p className="text-muted-foreground">Please select a group from the dropdown above to view its reports.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-muted/30 p-4 rounded-lg border">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Select Report Type:</span>
              <select className="h-9 w-[200px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                <option value="member">Member Report</option>
                <option value="contribution">Contribution Report</option>
                <option value="income">Income Report</option>
                <option value="expense">Expense Report</option>
                <option value="fund">Fund Summary</option>
                <option value="ledger">Ledger Report</option>
                <option value="monthly">Monthly Report</option>
                <option value="yearly">Yearly Report</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm"><Printer className="mr-2 h-4 w-4" /> Print</Button>
              <Button variant="outline" size="sm"><FileText className="mr-2 h-4 w-4" /> Export PDF</Button>
              <Button variant="outline" size="sm"><FileSpreadsheet className="mr-2 h-4 w-4" /> Export Excel</Button>
            </div>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Group Summary</CardTitle>
                <CardDescription>Overview of group details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Total Members:</span> <span>0</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Active Qard Hasan:</span> <span>{loanSummary.activeLoans}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Status:</span> <span>Active</span></div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Fund Position</CardTitle>
                <CardDescription>Current financial health</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Available Balance:</span> <span>{"৳0.00"}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Total Assets:</span> <span>{"৳0.00"}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Total Liabilities:</span> <span>{"৳0.00"}</span></div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contribution Summary</CardTitle>
                <CardDescription>Member savings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Expected This Month:</span> <span>{"৳0.00"}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Collected This Month:</span> <span>{"৳0.00"}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Arrears:</span> <span>{"৳0.00"}</span></div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="flex flex-col h-[300px]">
              <CardHeader>
                <CardTitle className="text-lg">Qard Hasan Summary</CardTitle>
                <CardDescription>Qard Hasan disbursement vs recovery</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col justify-center space-y-4">
                <div className="flex justify-between text-sm items-center">
                  <span className="text-muted-foreground font-medium">Qard Hasan by Group (Count):</span> 
                  <span className="font-bold text-lg">{loanSummary.activeLoans}</span>
                </div>
                <div className="flex justify-between text-sm items-center">
                  <span className="text-muted-foreground font-medium">Total Qard Hasan Disbursed:</span> 
                  <span className="font-bold text-lg text-primary">৳{formatCurrency(loanSummary.totalLent)}</span>
                </div>
                <div className="flex justify-between text-sm items-center">
                  <span className="text-muted-foreground font-medium">Outstanding Qard Hasan by Group:</span> 
                  <span className="font-bold text-lg text-destructive">৳{formatCurrency(loanSummary.totalOutstanding)}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="flex flex-col h-[300px]">
              <CardHeader>
                <CardTitle className="text-lg">Ledger Summary</CardTitle>
                <CardDescription>Monthly income and expenses</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-1 items-center justify-center text-muted-foreground">
                <div className="flex flex-col items-center space-y-2">
                  <BarChart3 className="h-8 w-8" />
                  <span>Chart Placeholder</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Sadaqah Summary</CardTitle>
              <CardDescription>Overview of received and utilized Sadaqah</CardDescription>
            </CardHeader>
            <CardContent>
               <div className="flex items-center justify-center h-24 text-muted-foreground text-sm">
                 No Sadaqah data available yet.
               </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
