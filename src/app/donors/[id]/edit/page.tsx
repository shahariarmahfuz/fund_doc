import { getDonor } from "@/features/donors/actions"
import { DonorForm } from "@/features/donors/components/donor-form"
import { notFound } from "next/navigation"

export const metadata = {
  title: "Edit Donor | Foundation ERP",
}

export default async function EditDonorPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  if (!resolvedParams.id) {
    notFound()
  }
  const donor = await getDonor(resolvedParams.id)
  
  if (!donor) {
    notFound()
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Donor</h1>
        <p className="text-muted-foreground">
          {donor.fullName} - Update donor information.</p>
      </div>

      <DonorForm mode="edit" donor={donor} />
    </div>
  )
}
