import { getReceivedDonations, getDonors } from "@/features/donors/actions"
import { getMembers } from "@/features/members/actions"
import { getGroups } from "@/features/groups/actions"
import { DonorLedgerClient } from "@/features/donors/components/donor-ledger-client"
import { BookOpen } from "lucide-react"
import Link from "next/link"
import { ChevronRight, FileSpreadsheet } from "lucide-react"

export const metadata = {
  title: "Donor Ledger | Foundation ERP",
  description: "Master Ledger for all Donor transactions",
}

export default async function DonorLedgerPage() {
  const [donations, donors, members, allGroups] = await Promise.all([
    getReceivedDonations(),
    getDonors(),
    getMembers(),
    getGroups(),
  ])
  const groups = (allGroups || []).filter(g => g.status === "ACTIVE")

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <Link href="/donors" className="hover:text-primary transition-colors">
          Donors
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="font-medium text-foreground">Ledger</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4 hide-print">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">Master Ledger</h1>
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            View complete ledger entries for all donors.
          </p>
        </div>
      </div>

      <DonorLedgerClient 
        data={donations}
        donors={donors.map(d => ({
          id: d.id,
          fullName: d.fullName,
          donorId: d.donorId,
          mobile: d.mobile,
        }))}
        members={members.map(m => ({
          id: m.id,
          memberId: m.memberId,
          fullName: m.fullName,
          group: m.group,
          status: m.status,
        }))}
        groups={groups.map(g => ({
          id: g.id,
          name: g.name,
        }))}
      />
    </div>
  )
}
