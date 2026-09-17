import { BeneficiarySelector } from "@/features/beneficiaries/components/beneficiary-selector"
import { Card, CardContent } from "@/components/ui/card"
import { HandCoins, PiggyBank } from "lucide-react"
import Link from "next/link"
import { ChevronRight } from "lucide-react"

export default async function BeneficiaryLoanHistoryPage({ searchParams }: { searchParams: Promise<{ beneficiaryId?: string }> }) {
  const resolvedParams = await searchParams
  const beneficiaryId = resolvedParams.beneficiaryId

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <Link href="/beneficiaries" className="hover:text-primary transition-colors">
          Beneficiaries
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="font-medium text-foreground">Qard Hasan History</span>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Qard Hasan History</h1>
          <p className="text-muted-foreground">Historical records of Qard Hasan and repayments for the beneficiary.</p>
        </div>
        <BeneficiarySelector />
      </div>

      {!beneficiaryId ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64 space-y-4">
            <HandCoins className="h-12 w-12 text-muted-foreground" />
            <div className="text-xl font-semibold">No Beneficiary Selected</div>
            <p className="text-muted-foreground">Please select a beneficiary to view their Qard Hasan history.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64 space-y-4 pt-6">
            <PiggyBank className="h-12 w-12 text-muted-foreground" />
            <div className="text-xl font-semibold">No Qard Hasan Records</div>
            <p className="text-muted-foreground">This beneficiary has not taken any Qard Hasan yet.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
