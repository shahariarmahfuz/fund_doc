import { BeneficiarySelector } from "@/features/beneficiaries/components/beneficiary-selector"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { BarChart3, Download, Printer, FileSpreadsheet, FileText, PieChart } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ChevronRight } from "lucide-react"

export default async function BeneficiaryReportsPage({ searchParams }: { searchParams: Promise<{ beneficiaryId?: string }> }) {
  const resolvedParams = await searchParams
  const beneficiaryId = resolvedParams.beneficiaryId

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <Link href="/beneficiaries" className="hover:text-primary transition-colors">
          Beneficiaries
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="font-medium text-foreground">Reports</span>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Beneficiary Reports</h1>
          <p className="text-muted-foreground">Comprehensive reporting and analytics for the beneficiary.</p>
        </div>
        <BeneficiarySelector />
      </div>

      {!beneficiaryId ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64 space-y-4">
            <BarChart3 className="h-12 w-12 text-muted-foreground" />
            <div className="text-xl font-semibold">No Beneficiary Selected</div>
            <p className="text-muted-foreground">Please select a beneficiary to view their reports.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-end items-center space-x-2">
            <Button variant="outline" size="sm"><Printer className="mr-2 h-4 w-4" /> Print</Button>
            <Button variant="outline" size="sm"><FileText className="mr-2 h-4 w-4" /> PDF</Button>
            <Button variant="outline" size="sm"><FileSpreadsheet className="mr-2 h-4 w-4" /> Excel</Button>
            <Button variant="outline" size="sm"><Download className="mr-2 h-4 w-4" /> CSV</Button>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Beneficiary Summary</CardTitle>
                <CardDescription>Overview of details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Status:</span> <span>Active</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Linked Member:</span> <span>Yes</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Joined:</span> <span>Recently</span></div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Qard Hasan Summary</CardTitle>
                <CardDescription>Qard Hasan disbursement vs recovery</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Total Qard Hasan:</span> <span>{"\u09f30.00"}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Total Repaid:</span> <span>{"\u09f30.00"}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Outstanding:</span> <span>{"\u09f30.00"}</span></div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Sadaqah Summary</CardTitle>
                <CardDescription>Assistance overview</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Total Sadaqah:</span> <span>{"\u09f30.00"}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Utilized:</span> <span>{"\u09f30.00"}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Remaining:</span> <span>{"\u09f30.00"}</span></div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="flex flex-col h-[300px]">
              <CardHeader>
                <CardTitle className="text-lg">Qard Hasan Recovery</CardTitle>
                <CardDescription>Chart displaying repayment history</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-1 items-center justify-center text-muted-foreground">
                <div className="flex flex-col items-center space-y-2">
                  <PieChart className="h-8 w-8" />
                  <span>Chart Placeholder</span>
                </div>
              </CardContent>
            </Card>

            <Card className="flex flex-col h-[300px]">
              <CardHeader>
                <CardTitle className="text-lg">Assistance Received</CardTitle>
                <CardDescription>Monthly distribution of assistance</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-1 items-center justify-center text-muted-foreground">
                <div className="flex flex-col items-center space-y-2">
                  <BarChart3 className="h-8 w-8" />
                  <span>Chart Placeholder</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
