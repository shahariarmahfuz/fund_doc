import { getGroupMembers } from "@/features/groups/actions"
import { GroupMembersTable } from "@/features/groups/components/group-members-table"
import { GroupSelector } from "@/features/groups/components/group-selector"
import { Card, CardContent } from "@/components/ui/card"
import { Users, ChevronRight } from "lucide-react"
import Link from "next/link"

export default async function GroupMembersPage({ searchParams }: { searchParams: Promise<{ groupId?: string }> }) {
  const resolvedParams = await searchParams
  const groupId = resolvedParams.groupId
  const members = groupId ? await getGroupMembers(groupId) : []

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <Link href="/groups" className="hover:text-primary transition-colors">
          Groups</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="font-medium text-foreground">Group Members</span>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Group Members</h1>
          <p className="text-muted-foreground mt-1">View and manage members by group.</p>
        </div>
        <GroupSelector />
      </div>

      {!groupId ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64 space-y-4">
            <Users className="h-12 w-12 text-muted-foreground" />
            <div className="text-xl font-semibold">No Group Selected</div>
            <p className="text-muted-foreground">Please select a group from the dropdown above to view its members.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Total Members: {members.length}</h2>
          </div>
          <GroupMembersTable data={members} />
        </div>
      )}
    </div>
  )
}
