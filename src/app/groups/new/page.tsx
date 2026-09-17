import { GroupForm } from "@/features/groups/components/group-form"
import Link from "next/link"
import { ChevronRight } from "lucide-react"

export default function AddGroupPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <Link href="/groups" className="hover:text-primary transition-colors">
          Groups</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="font-medium text-foreground">Add Group</span>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add Group</h1>
          <p className="text-muted-foreground mt-1">Create a new group in the organization.</p>
        </div>
      </div>

      <GroupForm />
    </div>
  )
}
