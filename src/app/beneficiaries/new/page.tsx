import { getMembers } from "@/features/members/actions"
import { BeneficiaryForm } from "@/features/beneficiaries/components/beneficiary-form"
import Link from "next/link"
import { ChevronRight } from "lucide-react"

export default async function NewBeneficiaryPage() {
  const members = await getMembers()

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <Link href="/beneficiaries" className="hover:text-primary transition-colors">
          Beneficiaries
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="font-medium text-foreground">Add Beneficiary</span>
      </div>
      
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Add Beneficiary</h1>
        <p className="text-muted-foreground">Register a new beneficiary in the system.</p>
      </div>

      <BeneficiaryForm members={members} />
    </div>
  )
}
