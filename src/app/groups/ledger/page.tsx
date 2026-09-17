import { getGroupLedger, getGroup } from "@/features/groups/actions"
import { GroupLedgerTable } from "@/features/groups/components/group-ledger-table"
import { GroupSelector } from "@/features/groups/components/group-selector"
import { Card, CardContent } from "@/components/ui/card"
import { BookOpen, ChevronRight } from "lucide-react"
import Link from "next/link"

export default async function GroupLedgerPage({ searchParams }: { searchParams: Promise<{ groupId?: string }> }) {
  const resolvedParams = await searchParams
  const groupId = resolvedParams.groupId
  const ledgerEntries = groupId ? await getGroupLedger(groupId) : []

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <Link href="/groups" className="hover:text-primary transition-colors">
          Groups</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="font-medium text-foreground">Group Ledger</span>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Group Ledger</h1>
          <p className="text-muted-foreground mt-1">View complete ledger records for the selected group.</p>
        </div>
        <GroupSelector />
      </div>

      {!groupId ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64 space-y-4">
            <BookOpen className="h-12 w-12 text-muted-foreground" />
            <div className="text-xl font-semibold">No Group Selected</div>
            <p className="text-muted-foreground">Please select a group from the dropdown above to view its ledger.</p>
          </CardContent>
        </Card>
      ) : (
        <GroupLedgerTable data={ledgerEntries} />
      )}
    </div>
  )
}
