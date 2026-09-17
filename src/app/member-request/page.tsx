import { getGroups, submitMemberRequest } from "@/features/member-requests/actions"
import { MemberForm } from "@/features/members/components/member-form"
import { Metadata } from "next"
import { PublicHeader } from "@/components/public-header"

export const metadata: Metadata = {
  title: "Member Request Form",
}

export default async function MemberRequestPage() {
  const groups = await getGroups()
  return (
    <div className="min-h-dvh w-full relative bg-gradient-to-br from-slate-50 to-slate-100 pt-20 sm:pt-24">
      <PublicHeader />
      <div className="max-w-4xl mx-auto py-8 px-4">
        <MemberForm 
          groups={groups} 
          mode="request" 
          onSubmitAction={submitMemberRequest}
        />
      </div>
    </div>
  )
}
