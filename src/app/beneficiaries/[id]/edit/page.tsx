import { getBeneficiary } from "@/features/beneficiaries/actions"
import { getMembers } from "@/features/members/actions"
import { BeneficiaryForm } from "@/features/beneficiaries/components/beneficiary-form"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

import { authorizePage } from "@/lib/rbac"

export default async function EditBeneficiaryPage({ params }: { params: Promise<{ id: string }> }) {
  await authorizePage("Beneficiaries", "Edit")

  const resolvedParams = await params;
  const beneficiary = await getBeneficiary(resolvedParams.id)
  
  if (!beneficiary) return notFound()

  const members = await getMembers()

  const initialData = {
    fullName: beneficiary.fullName || "",
    fatherOrHusbandName: beneficiary.fatherOrHusbandName || "",
    nationalId: beneficiary.nationalId || "",
    mobile: beneficiary.mobile || "",
    presentAddress: beneficiary.presentAddress || "",
    permanentAddress: beneficiary.permanentAddress || "",
    
    emergencyContactName: beneficiary.emergencyContactName || "",
    emergencyContactRelation: beneficiary.emergencyContactRelation || "",
    emergencyContactMobile: beneficiary.emergencyContactMobile || "",
    
    status: beneficiary.status || "ACTIVE",
    
    beneficiaryPhoto: beneficiary.beneficiaryPhoto || "",
    nidOrBirthCertificate: beneficiary.nidOrBirthCertificate || "",
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/beneficiaries/manage">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Beneficiary</h1>
          <p className="text-muted-foreground">{beneficiary.fullName || beneficiary.beneficiaryId}</p>
        </div>
      </div>
      
      <BeneficiaryForm 
        members={members} 
        mode="edit" 
        beneficiaryId={beneficiary.id} 
        initialData={initialData as any} 
        beneficiary={beneficiary} 
      />
    </div>
  )
}
