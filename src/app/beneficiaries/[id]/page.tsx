import { apiClient } from "@/lib/api/client"
import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft } from "lucide-react"
import { BeneficiaryProfileActions } from "@/features/beneficiaries/components/beneficiary-profile-actions"

const DocumentCard = ({ title, url }: { title: React.ReactNode, url?: string | null }) => (
  <div className="border rounded-md p-3">
    <p className="font-semibold text-sm mb-2 text-center border-b pb-2">{title}</p>
    {url ? (
      <a href={url} target="_blank" rel="noopener noreferrer" className="block relative h-40 w-full overflow-hidden hover:opacity-90">
        {url.endsWith('.pdf') ? (
          <div className="flex h-full items-center justify-center bg-muted/10 text-primary underline">PDF</div>
        ) : (
          <Image src={url} alt="Document" fill className="object-contain bg-muted/10" />
        )}
      </a>
    ) : (
      <div className="h-40 flex items-center justify-center text-sm text-muted-foreground italic">
        Personal Information</div>
    )}
  </div>
);

export default async function BeneficiaryDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  let beneficiary: any = null;
  try {
    beneficiary = await apiClient.beneficiaries.getById(resolvedParams.id);
  } catch (err) {
    console.error("Failed to fetch beneficiary:", err);
  }

  if (!beneficiary) return notFound()

  const getDoc = (title: string) => beneficiary.documents?.find((d: any) => d.title === title)?.secureUrl;
  
  const photoDoc = getDoc("Beneficiary Photo") || beneficiary.beneficiaryPhoto;
  const signatureDoc = getDoc("Signature");
  const nidFrontDoc = getDoc("NID Front") || beneficiary.nidOrBirthCertificate; // Fallback to legacy string if needed
  const nidBackDoc = getDoc("NID Back");
  const bcDoc = getDoc("Birth Certificate") || beneficiary.nidOrBirthCertificate; // Fallback to legacy string if needed

  return (
    <div className="max-w-5xl mx-auto space-y-8 print:m-0 print:p-0 bg-background text-foreground p-6 rounded-md shadow-sm border print:border-none print:shadow-none">
      {/* Top Navigation & Actions */}
      <div className="flex items-center justify-between pb-4 border-b print:hidden">
        <div className="flex items-center gap-4">
          <Link href="/beneficiaries/manage" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-bold">Full Name</h1>
        </div>
        <BeneficiaryProfileActions id={beneficiary.id} />
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* LEFT COLUMN */}
        <div className="flex-1 space-y-6">
          
          {/* SECTION 1 */}
          <section>
            <h2 className="text-lg font-bold bg-muted/30 px-3 py-1.5 border-l-4 border-primary mb-3">{"Father/Husband's Name"}</h2>
            <table className="w-full text-sm border-collapse">
              <tbody>
                <tr className="border-b"><td className="py-2 w-1/3 text-muted-foreground font-medium">National ID</td><td className="py-2 font-medium">{beneficiary.fullName || beneficiary.beneficiaryId} </td></tr>
                <tr className="border-b"><td className="py-2 text-muted-foreground font-medium">Mobile</td><td className="py-2">{beneficiary.fatherOrHusbandName || '-'}</td></tr>
                <tr className="border-b"><td className="py-2 text-muted-foreground font-medium">Present Address</td><td className="py-2">{beneficiary.nationalId || '-'}</td></tr>
                <tr className="border-b"><td className="py-2 text-muted-foreground font-medium">Permanent Address</td><td className="py-2">{beneficiary.mobile || '-'}</td></tr>
                <tr className="border-b"><td className="py-2 text-muted-foreground font-medium">Emergency Contact</td><td className="py-2">{beneficiary.presentAddress || beneficiary.address || '-'}</td></tr>
                <tr className="border-b"><td className="py-2 text-muted-foreground font-medium">Name</td><td className="py-2">{beneficiary.permanentAddress || '-'}</td></tr>
              </tbody>
            </table>
          </section>

          {/* SECTION 2 */}
          <section>
            <h2 className="text-lg font-bold bg-muted/30 px-3 py-1.5 border-l-4 border-primary mb-3 mt-6">Relation</h2>
            <table className="w-full text-sm border-collapse">
              <tbody>
                <tr className="border-b"><td className="py-2 w-1/3 text-muted-foreground font-medium">Mobile</td><td className="py-2">{beneficiary.emergencyContactName || '-'}</td></tr>
                <tr className="border-b"><td className="py-2 text-muted-foreground font-medium">Documents</td><td className="py-2">{beneficiary.emergencyContactRelation || '-'}</td></tr>
                <tr className="border-b"><td className="py-2 text-muted-foreground font-medium">No Photo</td><td className="py-2">{beneficiary.emergencyContactMobile || '-'}</td></tr>
              </tbody>
            </table>
          </section>

          {/* SECTION 3 */}
          <section className="print:break-before-page">
            <h2 className="text-lg font-bold bg-muted/30 px-3 py-1.5 border-l-4 border-primary mb-3 mt-6">Beneficiary ID</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DocumentCard title="Beneficiary Photo" url={photoDoc} />
              <DocumentCard title="Signature" url={signatureDoc} />
              
              {beneficiary.idDocumentType === "NID" ? (
                <>
                  <DocumentCard title="NID Front" url={nidFrontDoc} />
                  <DocumentCard title="NID Back" url={nidBackDoc} />
                </>
              ) : (
                <DocumentCard title="Birth Certificate" url={bcDoc} />
              )}
            </div>
          </section>

          {/* SECTION 4 - Financial Activity History */}
          <section className="print:break-before-page">
            <h2 className="text-lg font-bold bg-muted/30 px-3 py-1.5 border-l-4 border-primary mb-3 mt-6">Financial Activity History</h2>
            <table className="w-full text-sm border-collapse border">
              <thead>
                <tr className="bg-muted">
                  <th className="py-2 px-3 text-left border-b">Date</th>
                  <th className="py-2 px-3 text-left border-b">Activity</th>
                  <th className="py-2 px-3 text-left border-b">Amount</th>
                  <th className="py-2 px-3 text-left border-b">Reason</th>
                </tr>
              </thead>
              <tbody>
                {beneficiary.beneficiaryPayments?.length ? (
                  beneficiary.beneficiaryPayments.map((p: any) => (
                    <tr key={p.id} className="border-b">
                      <td className="py-2 px-3">{new Date(p.date).toLocaleDateString()}</td>
                      <td className="py-2 px-3 font-medium">
                        {p.reason || "Assistance"}
                      </td>
                      <td className="py-2 px-3 font-bold text-red-600">৳{p.amount}</td>
                      <td className="py-2 px-3 text-muted-foreground">{p.reason}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-muted-foreground">No financial activity history found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>
        </div>

        {/* RIGHT COLUMN */}
        <div className="w-full md:w-64 shrink-0 flex flex-col items-center pt-2 print:pt-10">
          <div className="border border-border p-2 bg-muted/10 w-full max-w-[200px]">
            <div className="relative w-full aspect-[4/5] bg-muted flex flex-col items-center justify-center border border-dashed border-muted-foreground/30">
              {photoDoc ? (
                <Image src={photoDoc} alt="Photo" fill className="object-cover" />
              ) : (
                <span className="text-sm text-muted-foreground">Status</span>
              )}
            </div>
          </div>
          
          <div className="mt-6 w-full max-w-[200px] text-center border p-4 bg-muted/5 space-y-3">
            <div>
              <p className="text-xs text-muted-foreground">Beneficiary ID</p>
              <p className="font-bold text-lg">{beneficiary.beneficiaryId}</p>
            </div>
            <div className="border-t pt-2">
              <p className="text-xs text-muted-foreground">Status</p>
              <p className={`font-semibold ${beneficiary.status === "ACTIVE" ? "text-green-600" : "text-red-600"}`}>
                {beneficiary.status === "ACTIVE" ? "Active" : "Inactive"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
