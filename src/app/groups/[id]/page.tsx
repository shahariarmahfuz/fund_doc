import { formatCurrency, formatDate } from "@/lib/format"
import { getGroup, getGroupFundSummary, getGroupLoans } from "@/features/groups/actions"
import { getDocumentsByEntity, getDocumentCategories } from "@/features/documents/actions"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Users, DollarSign, Activity } from "lucide-react"
import { DocumentList } from "@/features/documents/components/document-list"

export default async function GroupDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const group = await getGroup(resolvedParams.id)

  if (!group) return notFound()

  const rawFundSummary = await getGroupFundSummary(resolvedParams.id)
  const fundSummary = rawFundSummary || {
    currentBalance: 0,
    totalContributions: 0,
    totalTransactions: 0,
    totalDonations: 0
  }
  const loans = await getGroupLoans(resolvedParams.id)
  const documents = await getDocumentsByEntity("GROUP", resolvedParams.id)
  const categories = await getDocumentCategories()

  const activeMembers = (group.members || []).filter((m: any) => m.status === "ACTIVE").length
  const inactiveMembers = (group.members || []).filter((m: any) => m.status !== "ACTIVE").length

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/groups">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{group.name}</h1>
          <div className="flex items-center space-x-2 text-muted-foreground mt-1">
            <span>Code: {group.code}</span>
            <span>&bull;</span>
            <Badge variant={group.status === "ACTIVE" ? "default" : "secondary"}>
              {group.status}
            </Badge>
          </div>
        </div>
      </div>

      {/* Group Fund Summary */}
      <h2 className="text-xl font-bold tracking-tight mt-8">Fund Overview</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Fund</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">৳{formatCurrency(fundSummary?.currentBalance || 0)}</div>
            <p className="text-xs text-muted-foreground">Ledger Balance</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contributions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">৳{formatCurrency(fundSummary.totalContributions)}</div>
            <p className="text-xs text-muted-foreground">Lifetime</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Donations</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">৳{formatCurrency(fundSummary.totalDonations)}</div>
            <p className="text-xs text-muted-foreground">External Donations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fundSummary.totalTransactions}</div>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-xl font-bold tracking-tight mt-8">Membership</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{group._count.members}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeMembers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">{inactiveMembers}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Group Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <span className="font-semibold text-sm">Description</span>
            <p className="text-muted-foreground">{group.description || "No description provided."}</p>
          </div>
          <Separator />
          <div>
            <span className="font-semibold text-sm">Created Date</span>
            <p className="text-muted-foreground">{formatDate(group.createdAt)}</p>
          </div>
        </CardContent>
      </Card>

      <Separator />

      <h2 className="text-xl font-bold tracking-tight">Financed Qard Hasan</h2>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">Qard Hasan No</th>
                  <th className="px-4 py-2 text-left font-medium">Beneficiary</th>
                  <th className="px-4 py-2 text-right font-medium">Total Qard Hasan</th>
                  <th className="px-4 py-2 text-right font-medium">Group Financed</th>
                  <th className="px-4 py-2 text-center font-medium">Status</th>
                  <th className="px-4 py-2 text-center font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {loans.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                      No Qard Hasan financed by this group yet.
                    </td>
                  </tr>
                ) : (
                  (loans || []).map((alloc: any) => (
                    <tr key={alloc.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="px-4 py-2">{alloc.loan?.loanNumber}</td>
                      <td className="px-4 py-2">{alloc.loan?.beneficiary?.fullName || "-"}</td>
                      <td className="px-4 py-2 text-right">৳{formatCurrency(alloc.loan?.amount || 0)}</td>
                      <td className="px-4 py-2 text-right font-bold text-primary">৳{formatCurrency(alloc.amount)}</td>
                      <td className="px-4 py-2 text-center">
                        <Badge variant={alloc.loan?.status === "ACTIVE" ? "default" : alloc.loan?.status === "COMPLETED" ? "secondary" : "destructive"}>
                          {alloc.loan?.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-2 text-center">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/loans/${alloc.loanId}`}>View</Link>
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Separator />

      <DocumentList targetType="GROUP" entityId={group.id} documents={documents} categories={categories} />
    </div>
  )
}
