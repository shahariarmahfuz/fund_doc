import { getGrants } from "@/features/grants/actions"
import { GrantsTable } from "@/features/grants/components/grants-table"
import Link from "next/link"
import { ChevronRight, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sadaqah Management",
};

export default async function ManageGrantsPage() {
  const grants = await getGrants()

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <Link href="/dashboard" className="hover:text-primary transition-colors">
          Financial Activities</Link>
        <ChevronRight className="h-4 w-4" />
        <Link href="/grants" className="hover:text-primary transition-colors">
          Sadaqah</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="font-medium text-foreground">Manage Sadaqah</span>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manage Sadaqah</h1>
          <p className="text-muted-foreground mt-1">
            View and manage all organization Sadaqah</p>
        </div>
        <Button asChild>
          <Link href="/grants/new">
            <Plus className="mr-2 h-4 w-4" /> New Sadaqah</Link>
        </Button>
      </div>

      <GrantsTable data={grants as unknown as React.ComponentProps<typeof GrantsTable>['data']} manageMode={true} />
    </div>
  )
}
