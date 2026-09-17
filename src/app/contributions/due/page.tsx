import { getNow } from "@/lib/date";
import { formatMonth } from "@/lib/format"
import { getMembers } from "@/features/members/actions"
import { getContributions } from "@/features/contributions/actions"
import Link from "next/link"
import { ChevronRight, AlertCircle } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

export default async function DueContributionsPage() {
  const members = await getMembers()
  const contributions = await getContributions()
  
  const currentMonth = getNow().getMonth() + 1
  const currentYear = getNow().getFullYear()

  // Determine who has dues up to the current month
  // A member has dues if their paidUntil is before the current month (or if it's null)
  const dueMembers = members.filter(m => m.status === "ACTIVE").map(m => {
    let dueFromMonth = m.joinDate ? new Date(m.joinDate).getMonth() + 1 : 1;
    let dueFromYear = m.joinDate ? new Date(m.joinDate).getFullYear() : currentYear;

    if (m.paidUntilMonth && m.paidUntilYear) {
      dueFromMonth = m.paidUntilMonth + 1;
      dueFromYear = m.paidUntilYear;
      if (dueFromMonth > 12) {
        dueFromMonth = 1;
        dueFromYear++;
      }
    }
    
    // If dueFrom is in the future, they don't have dues
    if (dueFromYear > currentYear || (dueFromYear === currentYear && dueFromMonth > currentMonth)) {
      return null;
    }
    
    // Calculate total due months up to current month
    let monthsDue = 0;
    let cy = dueFromYear;
    let cm = dueFromMonth;
    while(cy < currentYear || (cy === currentYear && cm <= currentMonth)) {
      monthsDue++;
      cm++;
      if (cm > 12) {
        cm = 1;
        cy++;
      }
    }

    return {
      ...m,
      dueFromMonth,
      dueFromYear,
      monthsDue
    }
  }).filter(Boolean) as (typeof members[0] & { dueFromMonth: number, dueFromYear: number, monthsDue: number })[];

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <Link href="/contributions" className="hover:text-primary transition-colors">
          Contributions</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="font-medium text-foreground">Outstanding Dues</span>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Outstanding Dues</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Members with unpaid dues for {formatMonth(getNow().getMonth())} {currentYear}</p>
        </div>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Group</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Period</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dueMembers.length ? (
              dueMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">{member.fullName || 'Name not found'} ({member.memberId})</TableCell>
                  <TableCell>{member.group?.name || "N/A"}</TableCell>
                  <TableCell>
                    <Badge variant="destructive" className="flex w-fit items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {member.monthsDue} Total Months
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">
                    {formatMonth(member.dueFromMonth - 1)} {member.dueFromYear} <br/> 
                    <span className="text-muted-foreground">to</span> <br/> 
                    {formatMonth(currentMonth - 1)} {currentYear}
                  </TableCell>
                  <TableCell>
                    <Link href={`/contributions/new?memberId=${member.id}`} className="text-primary hover:underline text-sm font-medium">
                      Receive Payment</Link>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No outstanding dues found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
