import { getNow , formatDateInput} from "@/lib/date";
import { GrantForm } from "@/features/grants/components/grant-form"
import { getBeneficiaries } from "@/features/beneficiaries/actions"
import { getGroups } from "@/features/groups/actions"
import { getGrant } from "@/features/grants/actions"
import { getDocumentsByEntity } from "@/features/documents/actions"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { notFound } from "next/navigation"

export default async function EditGrantPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const beneficiaries = await getBeneficiaries()
  const groups = await getGroups()
  const grant = await getGrant(resolvedParams.id)

  if (!grant) return notFound()

  const documents = await getDocumentsByEntity("GRANT", grant.id)

  // Format initial data to match GrantFormValues
  const initialData = {
    beneficiaryId: grant.beneficiaryId,
    grantDate: grant.dateApproved ? new Date(grant.dateApproved).toISOString().split("T")[0] : formatDateInput(getNow()),
    amount: grant.amount,
    grantReason: grant.purpose,
    comment: grant.notes || "",
    allocations: (grant.allocations || []).length > 0 
      ? (grant.allocations || []).map((a: any) => ({ groupId: a.fund?.groupId || "", amount: a.amount })) 
      : [{ groupId: "", amount: 0 }]
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <Link href="/grants" className="hover:text-primary transition-colors">
          Sadaqah</Link>
        <ChevronRight className="h-4 w-4" />
        <Link href={`/grants/${grant.id}`} className="hover:text-primary transition-colors">
          {grant.grantNumber}
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="font-medium text-foreground">Edit Sadaqah</span>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Sadaqah</h1>
          <p className="text-muted-foreground mt-1">Modify existing Sadaqah details</p>
        </div>
      </div>

      <GrantForm 
        beneficiaries={beneficiaries} 
        groups={groups} 
        initialData={initialData} 
        initialDocuments={documents}
        grantId={grant.id} 
      />
    </div>
  )
}
