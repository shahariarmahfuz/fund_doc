import { getReceivedDonations, getDonors } from "@/features/donors/actions"
import { getMembers } from "@/features/members/actions"
import { getGroups } from "@/features/groups/actions"
import { DonationsTable } from "@/features/donors/components/donations-table"
import Link from "next/link"
import { ChevronRight, Plus, HeartHandshake } from "lucide-react"
import { Button } from "@/components/ui/button"

export const metadata = {
  title: "Donation Management | Foundation ERP",
  description: "Manage all received donation transactions, print receipts, and synchronize ledgers.",
}

export default async function ReceivedDonationsPage() {
  const [donations, donors, members, allGroups] = await Promise.all([
    getReceivedDonations(),
    getDonors(),
    getMembers(),
    getGroups(),
  ])
  const groups = (allGroups || []).filter(g => g.status === "ACTIVE")

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <Link href="/donors/manage" className="hover:text-primary transition-colors">
          Donors</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="font-medium text-foreground">Donation Transactions</span>
      </div>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <HeartHandshake className="w-7 h-7 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">Donation Transactions</h1>
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage all received donation transactions, print receipts, and synchronize ledgers.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild className="shadow-sm">
            <Link href="/donors/receive">
              <Plus className="mr-2 h-4 w-4" /> Receive Donation</Link>
          </Button>
        </div>
      </div>

      {/* Main Content Table */}
      <DonationsTable
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
