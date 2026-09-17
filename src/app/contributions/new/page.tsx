import { BulkContributionForm } from "@/features/contributions/components/bulk-contribution-form"
import { getMembers } from "@/features/members/actions"
import { getMonthlyMembershipFee } from "@/features/settings/actions"
import Link from "next/link"
import { ChevronRight } from "lucide-react"

export default async function AddContributionPage() {
  const [members, defaultMonthlyFee] = await Promise.all([
    getMembers(),
    getMonthlyMembershipFee(),
  ])

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <Link href="/contributions" className="hover:text-primary transition-colors">
          Contributions</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="font-medium text-foreground">Receive Contribution</span>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Receive Contribution</h1>
          <p className="text-muted-foreground">Record a new member contribution</p>
        </div>
      </div>

      <BulkContributionForm members={members} defaultMonthlyFee={defaultMonthlyFee} />
    </div>
  )
}
