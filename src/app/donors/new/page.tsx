import { DonorForm } from "@/features/donors/components/donor-form"

export const metadata = {
  title: "New Donor | Foundation ERP",
  description: "Add a new donor",
}

export default function NewDonorPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">New Donor</h1>
        <p className="text-muted-foreground">
          Register a new donor in the system.</p>
      </div>

      <DonorForm mode="create" />
    </div>
  )
}
