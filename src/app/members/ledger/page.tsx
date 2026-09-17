import { getMembers } from "@/features/members/actions"
import { MemberLedgerView } from "@/features/ledger/components/member-ledger-view"

export default async function MemberLedgerPage() {
  const members = await getMembers()

  // We add beneficiaryId: null to conform to the ComboboxMember type, although it's optional
  const formattedMembers = (members || []).map((m: any) => ({
    id: m.id,
    memberId: m.memberId,
    fullName: m.fullName,
    group: m.group ? { name: m.group.name, code: m.group.code } : null,
    beneficiaryId: null
  }))

  return (
    <div className="space-y-4">
      <MemberLedgerView members={formattedMembers} />
    </div>
  )
}
