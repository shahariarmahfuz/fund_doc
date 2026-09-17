import { getMember } from "@/features/members/actions"
import { getMemberDonations } from "@/features/donors/actions"
import { notFound } from "next/navigation"
import { MemberProfileActions } from "@/features/members/components/member-profile-actions"
import { MemberProfileLayout, MemberProfileData } from "@/features/members/components/member-profile-layout"

export default async function MemberProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const [member, voluntaryDonations] = await Promise.all([
    getMember(resolvedParams.id),
    getMemberDonations(resolvedParams.id),
  ])

  if (!member) return notFound()

  let reference = { name: "", mobile: "", relation: "" };
  try {
    if (member.reference) reference = JSON.parse(member.reference);
  } catch(e) {}

  const profileData: MemberProfileData = {
    ...member,
    referenceName: reference.name,
    referenceRelation: reference.relation,
    referenceMobile: reference.mobile,
    groupName: member.group?.name,
    groupCode: member.group?.code,
    statusHistory: (member as any).statusHistory,
    voluntaryDonations,
  }

  return (
    <MemberProfileLayout
      data={profileData}
      titleNode="Member Details"
      backHref="/members/manage"
      topActionNode={<MemberProfileActions memberId={member.id} />}
    />
  )
}
