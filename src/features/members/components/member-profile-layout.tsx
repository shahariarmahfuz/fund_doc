import { formatDate } from "@/lib/format"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft } from "lucide-react"

const DocumentCard = ({ title, url }: { title: React.ReactNode, url?: string | null }) => (
  <div className="border rounded-md p-3">
    <p className="font-semibold text-sm mb-2 text-center border-b pb-2">{title}</p>
    {url ? (
      <a href={url} target="_blank" rel="noopener noreferrer" className="block relative h-40 w-full overflow-hidden hover:opacity-90">
        {url.endsWith('.pdf') ? (
          <div className="flex h-full items-center justify-center bg-muted/10 text-primary underline">PDF</div>
        ) : (
          <img src={url} alt="Document" className="object-contain w-full h-full bg-muted/10" />
        )}
      </a>
    ) : (
      <div className="h-40 flex items-center justify-center text-sm text-muted-foreground italic">
        No documents uploaded.
      </div>
    )}
  </div>
);

const POSITION_LABELS: Record<string, string> = {
  PRESIDENT: "President",
  VICE_PRESIDENT: "Vice President",
  GENERAL_SECRETARY: "General Secretary",
  JOINT_SECRETARY: "Joint Secretary",
  ORGANIZING_SECRETARY: "Organizing Secretary",
  TREASURER: "Treasurer",
  ADVISOR: "Advisor",
  EXECUTIVE_MEMBER: "Executive Member",
  GENERAL_MEMBER: "General Member",
}

export interface MemberProfileData {
  fullName?: string | null
  fatherName?: string | null
  motherName?: string | null
  dob?: Date | string | null
  nationalId?: string | null
  occupation?: string | null
  education?: string | null
  bloodGroup?: string | null
  maritalStatus?: string | null
  presentAddress?: string | null
  permanentAddress?: string | null
  mobile?: string | null
  email?: string | null
  
  emergencyContactName?: string | null
  emergencyContactRelation?: string | null
  emergencyContactMobile?: string | null
  
  referenceName?: string | null
  referenceRelation?: string | null
  referenceMobile?: string | null

  groupName?: string | null
  groupCode?: string | null
  
  joinDate?: Date | string | null
  status?: string | null
  
  idDocumentType?: string | null
  
  memberId?: string | null
  applicationNumber?: string | null
  
  statusHistory?: any[]
  
  documents?: any[]
  position?: string | null
  reasonForJoining?: string | null
  voluntaryDonations?: { id: string; date: string; voucherNo: string; groupName: string; amount: number; remarks: string }[]
}

export function MemberProfileLayout({
  data,
  titleNode,
  backHref,
  topActionNode,
  bottomActionNode,
  statusNode,
}: {
  data: MemberProfileData
  titleNode: React.ReactNode
  backHref: string
  topActionNode?: React.ReactNode
  bottomActionNode?: React.ReactNode
  statusNode?: React.ReactNode
}) {
  const getDoc = (title: string) => data.documents?.find(d => d.title === title)?.secureUrl;
  
  const photoDoc = getDoc("Member Photo") || getDoc("Photo");
  const signatureDoc = getDoc("Signature");
  const nidFrontDoc = getDoc("NID Front") || getDoc("National ID"); 
  const nidBackDoc = getDoc("NID Back");
  const bcDoc = getDoc("Birth Certificate");

  return (
    <div className="max-w-5xl mx-auto space-y-8 print:m-0 print:p-0 bg-background text-foreground p-6 rounded-md shadow-sm border print:border-none print:shadow-none">
      {/* Top Navigation & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b print:hidden gap-4">
        <div className="flex items-center gap-4">
          <Link href={backHref} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-bold">{titleNode}</h1>
        </div>
        <div className="flex items-center gap-4 ml-auto">
          {statusNode}
          {topActionNode}
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* LEFT COLUMN */}
        <div className="flex-1 space-y-6">
          
          {/* SECTION 1 */}
          <section>
            <h2 className="text-lg font-bold bg-muted/30 px-3 py-1.5 border-l-4 border-primary mb-3">Personal Information</h2>
            <table className="w-full text-sm border-collapse">
              <tbody>
                <tr className="border-b"><td className="py-2 w-1/3 text-muted-foreground font-medium">Full Name</td><td className="py-2 font-medium">{data.fullName || ''} </td></tr>
                <tr className="border-b"><td className="py-2 text-muted-foreground font-medium">{"Father's Name"}</td><td className="py-2">{data.fatherName || '-'}</td></tr>
                <tr className="border-b"><td className="py-2 text-muted-foreground font-medium">{"Mother's Name"}</td><td className="py-2">{data.motherName || '-'}</td></tr>
                <tr className="border-b"><td className="py-2 text-muted-foreground font-medium">Date of Birth</td><td className="py-2">{data.dob ? formatDate(data.dob) : '-'}</td></tr>
                <tr className="border-b"><td className="py-2 text-muted-foreground font-medium">National ID</td><td className="py-2">{data.nationalId || '-'}</td></tr>
                <tr className="border-b"><td className="py-2 text-muted-foreground font-medium">Occupation</td><td className="py-2">{data.occupation || '-'}</td></tr>
                <tr className="border-b"><td className="py-2 text-muted-foreground font-medium">Education</td><td className="py-2">{data.education || '-'}</td></tr>
                <tr className="border-b"><td className="py-2 text-muted-foreground font-medium">Blood Group</td><td className="py-2">{data.bloodGroup || '-'}</td></tr>
                <tr className="border-b"><td className="py-2 text-muted-foreground font-medium">Marital Status</td><td className="py-2">{data.maritalStatus || '-'}</td></tr>
                <tr className="border-b"><td className="py-2 text-muted-foreground font-medium">Present Address</td><td className="py-2">{data.presentAddress || '-'}</td></tr>
                <tr className="border-b"><td className="py-2 text-muted-foreground font-medium">Permanent Address</td><td className="py-2">{data.permanentAddress || '-'}</td></tr>
                <tr className="border-b"><td className="py-2 text-muted-foreground font-medium">Mobile</td><td className="py-2">{data.mobile || '-'}</td></tr>
                <tr className="border-b"><td className="py-2 text-muted-foreground font-medium">Email</td><td className="py-2">{data.email || '-'}</td></tr>
              </tbody>
            </table>
          </section>

          {/* SECTION 2 */}
          <section>
            <h2 className="text-lg font-bold bg-muted/30 px-3 py-1.5 border-l-4 border-primary mb-3 mt-6">Emergency Contact</h2>
            <table className="w-full text-sm border-collapse">
              <tbody>
                <tr className="border-b"><td className="py-2 w-1/3 text-muted-foreground font-medium">Name</td><td className="py-2">{data.emergencyContactName || '-'}</td></tr>
                <tr className="border-b"><td className="py-2 text-muted-foreground font-medium">Relation</td><td className="py-2">{data.emergencyContactRelation || '-'}</td></tr>
                <tr className="border-b"><td className="py-2 text-muted-foreground font-medium">Mobile</td><td className="py-2">{data.emergencyContactMobile || '-'}</td></tr>
              </tbody>
            </table>
          </section>

          {/* SECTION 3 */}
          <section>
            <h2 className="text-lg font-bold bg-muted/30 px-3 py-1.5 border-l-4 border-primary mb-3 mt-6">Reference</h2>
            <table className="w-full text-sm border-collapse">
              <tbody>
                <tr className="border-b"><td className="py-2 w-1/3 text-muted-foreground font-medium">Name</td><td className="py-2">{data.referenceName || '-'}</td></tr>
                <tr className="border-b"><td className="py-2 text-muted-foreground font-medium">Relation</td><td className="py-2">{data.referenceRelation || '-'}</td></tr>
                <tr className="border-b"><td className="py-2 text-muted-foreground font-medium">Mobile</td><td className="py-2">{data.referenceMobile || '-'}</td></tr>
              </tbody>
            </table>
          </section>

          {/* SECTION 4 */}
          <section>
            <h2 className="text-lg font-bold bg-muted/30 px-3 py-1.5 border-l-4 border-primary mb-3 mt-6">Membership Information</h2>
            <table className="w-full text-sm border-collapse">
              <tbody>
                <tr className="border-b"><td className="py-2 w-1/3 text-muted-foreground font-medium">Group</td><td className="py-2">{data.groupName || '-'}</td></tr>
                <tr className="border-b"><td className="py-2 text-muted-foreground font-medium">Group Code</td><td className="py-2">{data.groupCode || '-'}</td></tr>
                <tr className="border-b"><td className="py-2 text-muted-foreground font-medium">Join Date</td><td className="py-2">{data.joinDate ? formatDate(data.joinDate) : '-'}</td></tr>
                <tr className="border-b"><td className="py-2 text-muted-foreground font-medium">Position</td><td className="py-2">{data.position ? POSITION_LABELS[data.position] || data.position : '-'}</td></tr>
              </tbody>
            </table>
          </section>

          {data.reasonForJoining && (
            <section>
              <h2 className="text-lg font-bold bg-muted/30 px-3 py-1.5 border-l-4 border-primary mb-3 mt-6">
                Reason for Joining
              </h2>
              <div className="border rounded-md p-4 bg-muted/10 text-sm whitespace-pre-wrap">
                {data.reasonForJoining}
              </div>
            </section>
          )}

          {(!data.reasonForJoining && data.applicationNumber) && (
            <section>
              <h2 className="text-lg font-bold bg-muted/30 px-3 py-1.5 border-l-4 border-primary mb-3 mt-6">
                Reason for Joining
              </h2>
              <div className="border rounded-md p-4 bg-muted/10 text-sm whitespace-pre-wrap text-muted-foreground italic">
                Not provided
              </div>
            </section>
          )}
          
          {/* SECTION 5 */}
          <section className="print:break-before-page">
            <h2 className="text-lg font-bold bg-muted/30 px-3 py-1.5 border-l-4 border-primary mb-3 mt-6">Documents</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DocumentCard title="Member Photo" url={photoDoc} />
              <DocumentCard title="Signature (Optional)" url={signatureDoc} />
              
              {data.idDocumentType === "NID" ? (
                <>
                  <DocumentCard title="National ID (Front)" url={nidFrontDoc} />
                  <DocumentCard title="National ID (Back)" url={nidBackDoc} />
                </>
              ) : (
                <DocumentCard title="Birth Certificate" url={bcDoc} />
              )}
            </div>
          </section>

          {/* Voluntary Donations Section */}
          {data.voluntaryDonations && data.voluntaryDonations.length > 0 && (
            <section className="print:break-before-page">
              <div className="flex items-center justify-between bg-muted/30 px-3 py-1.5 border-l-4 border-emerald-600 mb-3 mt-6">
                <h2 className="text-lg font-bold">Voluntary Donations</h2>
                <span className="text-sm font-bold text-emerald-600 font-mono">
                  Total: ৳{data.voluntaryDonations.reduce((acc, d) => acc + d.amount, 0).toLocaleString()}
                </span>
              </div>
              <div className="border rounded-md overflow-hidden">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-muted/50 font-semibold border-b">
                    <tr>
                      <th className="p-2">Date</th>
                      <th className="p-2">Voucher no</th>
                      <th className="p-2">Group</th>
                      <th className="p-2">Description / Comment</th>
                      <th className="p-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.voluntaryDonations.map((d) => (
                      <tr key={d.id} className="border-b hover:bg-muted/20">
                        <td className="p-2">{formatDate(d.date)}</td>
                        <td className="p-2 font-mono text-primary font-medium">{d.voucherNo}</td>
                        <td className="p-2">{d.groupName}</td>
                        <td className="p-2 text-muted-foreground">{d.remarks || '-'}</td>
                        <td className="p-2 text-right font-bold text-emerald-600 font-mono">৳{d.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* SECTION 6 (Audit) */}
          {data.statusHistory && data.statusHistory.length > 0 && (
            <section className="print:break-before-page">
              <h2 className="text-lg font-bold bg-muted/30 px-3 py-1.5 border-l-4 border-primary mb-3 mt-6">Status History</h2>
              <div className="border rounded-md overflow-hidden">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-muted/50 font-semibold border-b">
                    <tr>
                      <th className="p-2">Date</th>
                      <th className="p-2">From</th>
                      <th className="p-2">To</th>
                      <th className="p-2">Reason / Note</th>
                      <th className="p-2">Changed By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.statusHistory.map((h: any, idx: number) => (
                      <tr key={h.id || idx} className="border-b hover:bg-muted/20">
                        <td className="p-2">{formatDate(h.changedAt)}</td>
                        <td className="p-2 font-mono">{h.fromStatus}</td>
                        <td className="p-2 font-mono font-semibold">{h.toStatus}</td>
                        <td className="p-2">{h.reason || h.notes || '-'}</td>
                        <td className="p-2 font-medium">{h.changedBy || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {bottomActionNode && (
            <section className="mt-8">
              {bottomActionNode}
            </section>
          )}
        </div>

        {/* RIGHT COLUMN */}
        <div className="w-full md:w-64 shrink-0 flex flex-col items-center pt-2 print:pt-10">
          <div className="border border-border p-2 bg-muted/10 w-full max-w-[200px]">
            <div className="relative w-full aspect-[4/5] bg-muted flex flex-col items-center justify-center border border-dashed border-muted-foreground/30">
              {photoDoc ? (
                <img src={photoDoc} alt="Photo" className="object-cover w-full h-full absolute inset-0" />
              ) : (
                <span className="text-sm text-muted-foreground">No Photo</span>
              )}
            </div>
          </div>
          
          <div className="mt-6 w-full max-w-[200px] text-center border p-4 bg-muted/5 space-y-3">
            {data.memberId && (
              <div>
                <p className="text-xs text-muted-foreground">Member ID</p>
                <p className="font-bold text-lg">{data.memberId}</p>
              </div>
            )}
            {data.applicationNumber && (
              <div>
                <p className="text-xs text-muted-foreground">Application Number</p>
                <p className="font-bold text-lg">{data.applicationNumber}</p>
              </div>
            )}
            <div className="border-t pt-2">
              <p className="text-xs text-muted-foreground">Group Code</p>
              <p className="font-semibold">{data.groupCode || '-'}</p>
            </div>
            {data.joinDate && (
              <div className="border-t pt-2">
                <p className="text-xs text-muted-foreground">Join Date</p>
                <p className="font-semibold">{formatDate(data.joinDate)}</p>
              </div>
            )}
            <div className="border-t pt-2">
              <p className="text-xs text-muted-foreground">Status</p>
              <p className={`font-semibold ${data.status === "ACTIVE" || data.status === "APPROVED" ? "text-green-600" : data.status === "REJECTED" ? "text-red-600" : "text-amber-600"}`}>
                {data.status === "ACTIVE" ? "Active" 
                : data.status === "INACTIVE" ? "Inactive"
                : data.status}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
