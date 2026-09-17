import { LoanForm } from "@/features/loans/components/loan-form"
import { getGroups } from "@/features/groups/actions"
import { getBeneficiaries } from "@/features/beneficiaries/actions"

export default async function NewLoanPage() {
  const [allBeneficiaries, groups] = await Promise.all([
    getBeneficiaries(),
    getGroups()
  ])

  const beneficiaries = (allBeneficiaries || []).filter((b: any) => b.status === "ACTIVE")

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-4xl space-y-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">New Qard Hasan</h1>
            <p className="text-muted-foreground">
              Create and configure a new Qard Hasan application
            </p>
          </div>
          <LoanForm beneficiaries={beneficiaries} groups={groups} />
        </div>
      </div>
    </div>
  )
}
