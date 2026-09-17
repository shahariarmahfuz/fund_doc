import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { BarChart3, Download, Printer, FileSpreadsheet, FileText, PieChart } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ChevronRight } from "lucide-react"

export default function ContributionReportsPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <Link href="/contributions" className="hover:text-primary transition-colors">
          Contributions
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="font-medium text-foreground">Reports</span>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contribution Reports</h1>
          <p className="text-muted-foreground">Analytics and comprehensive reports on contributions.</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-end items-center space-x-2">
          <Button variant="outline" size="sm"><Printer className="mr-2 h-4 w-4" /> Print</Button>
          <Button variant="outline" size="sm"><FileText className="mr-2 h-4 w-4" /> PDF</Button>
          <Button variant="outline" size="sm"><FileSpreadsheet className="mr-2 h-4 w-4" /> Excel</Button>
          <Button variant="outline" size="sm"><Download className="mr-2 h-4 w-4" /> CSV</Button>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Monthly Collection</CardTitle>
              <CardDescription>Total for current month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{"\u09f30.00"}</div>
              <p className="text-xs text-muted-foreground mt-1">0% from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Group-wise Collection</CardTitle>
              <CardDescription>Top performing group</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">N/A</div>
              <p className="text-xs text-muted-foreground mt-1">N/A collected</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Member Collection</CardTitle>
              <CardDescription>Active paying members</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground mt-1">0% active rate</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Outstanding Dues</CardTitle>
              <CardDescription>Unpaid contributions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{"\u09f30.00"}</div>
              <p className="text-xs text-muted-foreground mt-1">0 members due</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="flex flex-col h-[350px]">
            <CardHeader>
              <CardTitle className="text-lg">Collection Trend</CardTitle>
              <CardDescription>Monthly collection over the year</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-1 items-center justify-center text-muted-foreground">
              <div className="flex flex-col items-center space-y-2">
                <BarChart3 className="h-12 w-12 opacity-50" />
                <span>Chart Placeholder</span>
              </div>
            </CardContent>
          </Card>

          <Card className="flex flex-col h-[350px]">
            <CardHeader>
              <CardTitle className="text-lg">Collection by Group</CardTitle>
              <CardDescription>Distribution across active groups</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-1 items-center justify-center text-muted-foreground">
              <div className="flex flex-col items-center space-y-2">
                <PieChart className="h-12 w-12 opacity-50" />
                <span>Chart Placeholder</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
