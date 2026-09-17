import { GrantForm } from "@/features/grants/components/grant-form"
import { getBeneficiaries } from "@/features/beneficiaries/actions"
import { getGroups } from "@/features/groups/actions"
import Link from "next/link"
import { ChevronRight } from "lucide-react"

export default async function AddGrantPage() {
  const beneficiaries = await getBeneficiaries()
  const groups = await getGroups()

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <Link href="/grants" className="hover:text-primary transition-colors">
          Sadaqah</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="font-medium text-foreground">New Sadaqah</span>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Sadaqah</h1>
          <p className="text-muted-foreground mt-1">Create a new Sadaqah for a beneficiary</p>
        </div>
      </div>

      <GrantForm beneficiaries={beneficiaries} groups={groups} />
    </div>
  )
}
