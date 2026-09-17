import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Group Management",
};

import { getGroups } from "@/features/groups/actions"
import { GroupsTable } from "@/features/groups/components/groups-table"
import Link from "next/link"
import { ChevronRight, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

export default async function ManageGroupsPage() {
  const groups = await getGroups()

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <Link href="/groups" className="hover:text-primary transition-colors">
          Groups</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="font-medium text-foreground">Manage Groups</span>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manage Groups</h1>
          <p className="text-muted-foreground mt-1">
            Manage existing groups, edit details, and control status.</p>
        </div>
        <Button asChild>
          <Link href="/groups/new">
            <Plus className="mr-2 h-4 w-4" /> Add Group</Link>
        </Button>
      </div>

      <GroupsTable data={groups} manageMode={true} />
    </div>
  )
}
