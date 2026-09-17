import { notFound } from "next/navigation"
import { getMemberRequest } from "@/features/member-requests/actions"
import { getGroup } from "@/features/groups/actions"
import { authorizePage } from "@/lib/rbac"
import { RequestActions } from "@/features/member-requests/components/request-actions"
import { Badge } from "@/components/ui/badge"
import { MemberProfileLayout, MemberProfileData } from "@/features/members/components/member-profile-layout"
import { Card, CardContent } from "@/components/ui/card"

export default async function MemberRequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await authorizePage("Members", "View")
  const resolvedParams = await params;
  if (!resolvedParams.id) {
    notFound()
  }
  const request = await getMemberRequest(resolvedParams.id)

  if (!request) {
    notFound()
  }

  let groupName = null
  let groupCode = null
  
  if (request.groupId) {
    const group = await getGroup(request.groupId)
    if (group) {
      groupName = group.name
      groupCode = group.code
    }
  }

  const documents = request.documents ? JSON.parse(request.documents) : []

  const profileData: MemberProfileData = {
    ...request,
    referenceName: request.referenceName,
    referenceRelation: request.referenceRelation,
    referenceMobile: request.referenceMobile,
    groupName: groupName,
    groupCode: groupCode,
    joinDate: request.submittedAt,
    applicationNumber: request.applicationNumber,
    documents: documents
  }

  const statusBadge = (
    <Badge 
      variant="outline" 
      className={`text-sm px-3 py-1 ${
        request.status === 'PENDING' ? 'bg-amber-100 text-amber-800 border-amber-200' :
        request.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
        request.status === 'REJECTED' ? 'bg-rose-100 text-rose-800 border-rose-200' :
        'bg-blue-100 text-blue-800 border-blue-200'
      }`}
    >
      {request.status === "PENDING" ? "Pending Review" 
      : request.status === "APPROVED" ? "Approved"
      : request.status === "REJECTED" ? "Rejected"
      : request.status === "NEEDS_CHANGES" ? "Changes Requested"
      : request.status}
    </Badge>
  )

  const adminNotes = (
    <div className="space-y-4">
      {request.adminMessage && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-blue-800 mb-2">Message from Admin</h3>
            <p className="text-blue-700">{request.adminMessage}</p>
          </CardContent>
        </Card>
      )}

      {request.rejectionReason && (
        <Card className="border-rose-200 bg-rose-50">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-rose-800 mb-2">Rejection Reason</h3>
            <p className="text-rose-700">{request.rejectionReason}</p>
          </CardContent>
        </Card>
      )}
      
      <div className="mt-6">
        <RequestActions requestId={request.id} status={request.status} />
      </div>
    </div>
  )

  return (
    <MemberProfileLayout
      data={profileData}
      titleNode={<>Application Details {request.applicationNumber}</>}
      backHref="/members/requests"
      statusNode={statusBadge}
      bottomActionNode={adminNotes}
    />
  )
}
