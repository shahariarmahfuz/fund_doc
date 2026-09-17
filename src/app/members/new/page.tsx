import { getMemberSignupGroups } from "@/features/groups/actions"
import { generateMemberId } from "@/features/members/actions"
import { MemberForm } from "@/features/members/components/member-form"

export default async function AddMemberPage() {
  const groups = await getMemberSignupGroups()
  const nextMemberId = await generateMemberId()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">New Member</h1>
      </div>
      <MemberForm groups={groups} mode="create" initialData={{ memberId: nextMemberId }} />
    </div>
  )
}
