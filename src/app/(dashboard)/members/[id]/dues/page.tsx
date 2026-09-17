import { formatDate, formatCurrency } from "@/lib/format"
import { apiClient } from "@/lib/api/client"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Wallet } from "lucide-react"
import { generateMissingContributions } from "@/features/members/due-actions"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Member Dues",
};

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function getMonthName(monthNumber: number) {
  return monthNames[monthNumber - 1] || "";
}

export default async function DueDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  
  // Ensure contributions are up to date
  await generateMissingContributions();
  
  let member: any = null;
  try {
    const [memberData, contributionsData] = await Promise.all([
      apiClient.members.getById(resolvedParams.id),
      apiClient.contributions.getAll({ memberId: resolvedParams.id })
    ]);
    if (memberData) {
      member = {
        ...memberData,
        contributions: contributionsData || []
      };
    }
  } catch (err) {
    console.error("Error fetching member dues:", err);
  }

  if (!member) return notFound();

  let expectedContribution = 0;
  let totalPaid = 0;
  let monthlyContribution = 0;

  // The most recent default contribution
  const regularConts = (member.contributions || []).filter((c: any) => !c.isAdditional).sort((a: any, b: any) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.month - a.month;
  });
  
  if (regularConts.length > 0) {
    monthlyContribution = regularConts[0].expectedAmount;
  }

  // Calculate totals
  (member.contributions || []).forEach((cont: any) => {
    if (!cont.isAdditional) {
      expectedContribution += cont.expectedAmount;
    }
    (cont.payments || []).forEach((payment: any) => {
      totalPaid += payment.amount;
    });
  });

  let currentDue = expectedContribution - totalPaid;
  let advanceBalance = 0;

  if (currentDue < 0) {
    advanceBalance = Math.abs(currentDue);
    currentDue = 0;
  }

  // Distribute totalPaid chronologically
  let remainingTotalPaid = totalPaid;
  
  const chronologicalMonths = [...regularConts].reverse(); // oldest first
  const monthData = [];
  
  let totalDueMonths = 0;

  for (const month of chronologicalMonths) {
    if (remainingTotalPaid >= month.expectedAmount) {
      monthData.push({ ...month, status: 'Paid' });
      remainingTotalPaid -= month.expectedAmount;
    } else {
      monthData.push({ ...month, status: 'Due' });
      totalDueMonths++;
    }
  }

  // Reverse back to newest first for display
  monthData.reverse();

  return (
    <div className="max-w-5xl mx-auto space-y-8 print:m-0 print:p-0 bg-background text-foreground p-6 rounded-md shadow-sm border print:border-none print:shadow-none">
      {/* Top Navigation & Actions */}
      <div className="flex items-center justify-between pb-4 border-b print:hidden">
        <div className="flex items-center gap-4">
          <Link href="/members/manage" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-bold">Member Dues</h1>
        </div>
        <Button asChild>
          <Link href={`/contributions/new?memberId=${member.id}`}>
            <Wallet className="mr-2 h-4 w-4" /> Collect Contribution
          </Link>
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <div className="flex-1 space-y-6">
          <section>
            <h2 className="text-lg font-bold bg-muted/30 px-3 py-1.5 border-l-4 border-primary mb-3">Member Overview</h2>
            <table className="w-full text-sm border-collapse">
              <tbody>
                <tr className="border-b"><td className="py-2 w-1/3 text-muted-foreground font-medium">Member Name</td><td className="py-2 font-medium">{member.fullName || 'Name not found'}</td></tr>
                <tr className="border-b"><td className="py-2 text-muted-foreground font-medium">Member ID</td><td className="py-2">{member.memberId || '-'}</td></tr>
                <tr className="border-b"><td className="py-2 text-muted-foreground font-medium">Group</td><td className="py-2">{member.group?.name || '-'} ({member.group?.code || '-'})</td></tr>
                <tr className="border-b"><td className="py-2 text-muted-foreground font-medium">Monthly Contribution</td><td className="py-2">৳ {formatCurrency(monthlyContribution)}</td></tr>
                <tr className="border-b"><td className="py-2 text-muted-foreground font-medium">Total Due Months</td><td className="py-2 text-red-600 font-bold">{totalDueMonths} Months</td></tr>
                <tr className="border-b"><td className="py-2 text-muted-foreground font-medium">Current Due</td><td className="py-2 text-red-600 font-bold">৳ {formatCurrency(currentDue)}</td></tr>
                {advanceBalance > 0 && (
                  <tr className="border-b"><td className="py-2 text-muted-foreground font-medium">Advance Balance</td><td className="py-2 text-green-600 font-bold">৳ {formatCurrency(advanceBalance)}</td></tr>
                )}
              </tbody>
            </table>
          </section>

          <section>
            <h2 className="text-lg font-bold bg-muted/30 px-3 py-1.5 border-l-4 border-primary mb-3 mt-6">Contribution Status by Month</h2>
            <div className="rounded-md border bg-card overflow-hidden">
              <table className="w-full text-sm border-collapse text-left">
                <thead className="bg-muted text-muted-foreground">
                  <tr>
                    <th className="py-3 px-4 font-medium border-b">Month</th>
                    <th className="py-3 px-4 font-medium border-b">Expected Amount</th>
                    <th className="py-3 px-4 font-medium border-b text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {monthData.map((data, idx) => (
                    <tr key={idx} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="py-3 px-4">
                        {getMonthName(data.month)} {data.year}
                      </td>
                      <td className="py-3 px-4">
                        ৳ {formatCurrency(data.expectedAmount)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Badge variant={data.status === 'Paid' ? 'default' : 'destructive'} className="font-normal">
                          {data.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                  {monthData.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-muted-foreground">
                        No monthly contribution records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
