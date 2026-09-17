import { DonationForm } from "@/features/donors/components/donation-form"
import { getDonors } from "@/features/donors/actions"
import { getMembers } from "@/features/members/actions"
import { getGroups } from "@/features/groups/actions"
import Link from "next/link"
import { ChevronRight } from "lucide-react"

export const metadata = {
  title: "Receive Donation | Foundation ERP",
}

export default async function ReceiveDonationPage() {
  const [donors, members, allGroups] = await Promise.all([
    getDonors(),
    getMembers(),
    getGroups(),
  ])
  const groups = (allGroups || []).filter(g => g.status === "ACTIVE")

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <Link href="/donors/manage" className="hover:text-primary transition-colors">
          Donors</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="font-medium text-foreground">Receive Donation</span>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Receive Donation</h1>
          <p className="text-muted-foreground">
            Record a new donation transaction.</p>
        </div>
      </div>

      <DonationForm 
        donors={donors.map(d => ({
          id: d.id,
          fullName: d.fullName,
          donorId: d.donorId,
          mobile: d.mobile
        }))} 
        members={members.map(m => ({
          id: m.id,
          memberId: m.memberId,
          fullName: m.fullName,
          group: m.group,
          status: m.status
        }))}
        groups={groups.map(g => ({
          id: g.id,
          name: g.name
        }))} 
      />
    </div>
  )
}
