import { getMember } from "@/features/members/actions"
import { getGroups } from "@/features/groups/actions"
import { MemberForm } from "@/features/members/components/member-form"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

import { authorizePage } from "@/lib/rbac"

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Edit Member",
};

export default async function EditMemberPage({ params }: { params: Promise<{ id: string }> }) {
  await authorizePage("Members", "Edit")

  const resolvedParams = await params;
  const member = await getMember(resolvedParams.id)
  
  if (!member) return notFound()

  const groups = await getGroups()

  let parsedReference = { name: "", mobile: "", relation: "" };
  try {
    if (member?.reference) {
      parsedReference = JSON.parse(member.reference);
    }
  } catch (e) {}

  // Find existing documents for initialization (optional for form defaults, but useful if needed)
  const idDocument = member.documents?.find((d: any) => d.title === "National ID" || d.title === "Birth Certificate")
  const idDocType = idDocument?.title === "Birth Certificate" ? "BIRTH_CERTIFICATE" : "NID"

  // Convert the DB member to initial form data matching MemberFormValues
  const initialData = {
    memberId: member.memberId || "",
    joinDate: member.joinDate ? new Date(member.joinDate).toISOString().split('T')[0] : "",
    groupId: member.groupId || "",
    fullName: member.fullName || "",
    fatherName: member.fatherName || "",
    motherName: member.motherName || "",
    dob: member.dob ? new Date(member.dob).toISOString().split('T')[0] : "",
    nationalId: member.nationalId || "",
    occupation: member.occupation || "",
    education: member.education || "",
    presentAddress: member.presentAddress || "",
    permanentAddress: member.permanentAddress || "",
    mobile: member.mobile || "",
    email: member.email || "",
    bloodGroup: member.bloodGroup || "",
    
    emergencyContactName: member.emergencyContactName || "",
    emergencyContactMobile: member.emergencyContactMobile || "",
    emergencyContactRelation: member.emergencyContactRelation || "",
    
    referenceName: parsedReference.name || "",
    referenceMobile: parsedReference.mobile || "",
    referenceRelation: parsedReference.relation || "",
    
    idDocumentType: idDocType,
    photoBase64: "", // Leave blank, the component will handle showing existing via member prop
    idDocumentBase64: "",
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/members/manage">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Member</h1>
          <p className="text-muted-foreground">{member.fullName || ''} Edit Member</p>
        </div>
      </div>
      
      <MemberForm 
        groups={groups} 
        mode="edit" 
        memberId={member.id} 
        initialData={initialData as any} 
        member={member} 
      />
    </div>
  )
}
