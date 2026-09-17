"use client"

import { useState, useEffect } from "react"
import { getMemberContributionLedger, type ContributionLedgerItem } from "../ledger-actions"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCurrency } from "@/lib/format"
import { Printer, Download, User, Calendar, RefreshCw, X, ArrowLeft, ArrowRight } from "lucide-react"
import { toast } from "sonner"
import { LedgerPrintTemplate } from "./ledger-print-template"

interface MemberLedgerModalProps {
  memberId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  foundationName?: string
  foundationLogo?: string | null
  userName?: string
}

export function MemberLedgerModal({
  memberId,
  open,
  onOpenChange,
  foundationName = "Foundation ERP",
  foundationLogo,
  userName = "Admin",
}: MemberLedgerModalProps) {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any | null>(null)
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [page, setPage] = useState(1)
  const [isPrinting, setIsPrinting] = useState(false)

  const fetchMemberLedger = async () => {
    if (!memberId) return
    setLoading(true)
    try {
      const res = await getMemberContributionLedger(memberId, {
        from: from || undefined,
        to: to || undefined,
        page,
        limit: 15,
      })
      setData(res)
    } catch (err: any) {
      toast.error(err.message || "Failed to load member ledger")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open && memberId) {
      fetchMemberLedger()
    }
  }, [open, memberId, page, from, to])

  const handlePrint = () => {
    window.print()
  }

  const handleExportCSV = () => {
    if (!data?.items || data.items.length === 0) {
      toast.error("No ledger data to export")
      return
    }

    const headers = ["Date", "Receipt No", "Type", "Debit", "Credit", "Balance", "Method", "Collector", "Remarks"]
    const rows = data.items.map((item: ContributionLedgerItem) => [
      `"${item.paymentDate.split("T")[0]}"`,
      `"${item.receiptNo}"`,
      `"${item.contributionType}"`,
      item.debit,
      item.credit,
      item.balance,
      `"${item.paymentMethod}"`,
      `"${item.collector}"`,
      `"${item.remarks.replace(/"/g, '""')}"`,
    ])

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r: any) => r.join(","))].join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `Member_Ledger_${data.member?.memberId || "Export"}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success("Member ledger exported to CSV")
  }

  if (!memberId) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="flex flex-row items-center justify-between pb-2 border-b">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
              <User className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">
                {data?.member?.fullName || "Member Contribution Ledger"} ({data?.member?.memberId || ""})
              </DialogTitle>
              <p className="text-xs text-muted-foreground">
                Group: <span className="font-semibold text-foreground">{data?.member?.groupName}</span> | Mobile: {data?.member?.mobile}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 print:hidden">
            <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={loading || !data?.items?.length}>
              <Download className="h-4 w-4 mr-1.5" />
              Export CSV
            </Button>
            <Button variant="default" size="sm" onClick={handlePrint} disabled={loading || !data?.items?.length}>
              <Printer className="h-4 w-4 mr-1.5" />
              Print Ledger
            </Button>
          </div>
        </DialogHeader>

        {/* Date Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 py-3 bg-muted/40 p-3 rounded-lg print:hidden">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-semibold">Select Date:</span>
          </div>

          <div className="flex items-center gap-2">
            <Input
              type="date"
              className="h-8 text-xs w-36"
              value={from}
              onChange={(e) => {
                setFrom(e.target.value)
                setPage(1)
              }}
            />
            <span className="text-xs text-muted-foreground">to</span>
            <Input
              type="date"
              className="h-8 text-xs w-36"
              value={to}
              onChange={(e) => {
                setTo(e.target.value)
                setPage(1)
              }}
            />
            {(from || to) && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs"
                onClick={() => {
                  setFrom("")
                  setTo("")
                  setPage(1)
                }}
              >
                <X className="h-3.5 w-3.5 mr-1" />
                Reset Filter
              </Button>
            )}
          </div>
        </div>

        {/* Member Summary Cards */}
        {data?.summary && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:hidden">
            <Card className="bg-slate-50 border-slate-200">
              <CardContent className="p-3 text-center">
                <span className="text-[11px] text-muted-foreground block">Previous Balance</span>
                <span className="font-bold text-base text-foreground">৳ {formatCurrency(data.summary.previousBalance)}</span>
              </CardContent>
            </Card>

            <Card className="bg-emerald-50/50 border-emerald-200">
              <CardContent className="p-3 text-center">
                <span className="text-[11px] text-muted-foreground block">Total Deposits</span>
                <span className="font-bold text-base text-emerald-600">
                  ৳ {formatCurrency(data.summary.totalContributions)}
                </span>
              </CardContent>
            </Card>

            <Card className="bg-rose-50/50 border-rose-200">
              <CardContent className="p-3 text-center">
                <span className="text-[11px] text-muted-foreground block">Total Refunds</span>
                <span className="font-bold text-base text-rose-600">
                  ৳ {formatCurrency(data.summary.totalRefunds)}
                </span>
              </CardContent>
            </Card>

            <Card className="bg-blue-50/50 border-blue-200">
              <CardContent className="p-3 text-center">
                <span className="text-[11px] text-muted-foreground block">Closing Balance</span>
                <span className="font-bold text-base text-blue-600">
                  ৳ {formatCurrency(data.summary.closingBalance)}
                </span>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Interactive Member Ledger Table */}
        <div className="rounded-md border overflow-x-auto print:hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[100px]">Date</TableHead>
                <TableHead>Receipt No</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Debit (৳)</TableHead>
                <TableHead className="text-right">Credit (৳)</TableHead>
                <TableHead className="text-right">Balance (৳)</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Collector</TableHead>
                <TableHead>Remarks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                    <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                      <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-primary" />
                      Loading ledger data...
                    </TableCell>
                </TableRow>
              ) : !data?.items?.length ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                    No contribution records found for this member.
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {data.summary.previousBalance !== 0 && (
                    <TableRow className="bg-muted/30 font-medium">
                      <TableCell colSpan={5} className="text-xs">
                        Opening / Previous Balance
                      </TableCell>
                      <TableCell className="text-right font-bold text-xs font-mono">
                        ৳ {formatCurrency(data.summary.previousBalance)}
                      </TableCell>
                      <TableCell colSpan={3}></TableCell>
                    </TableRow>
                  )}

                  {data.items.map((item: ContributionLedgerItem) => (
                    <TableRow key={item.id} className="text-xs">
                      <TableCell className="whitespace-nowrap font-medium">{item.paymentDate.split("T")[0]}</TableCell>
                      <TableCell className="font-mono text-[11px]">{item.receiptNo}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            item.contributionType === "REFUND"
                              ? "destructive"
                              : item.contributionType === "ADDITIONAL"
                              ? "secondary"
                              : item.contributionType === "ADJUSTMENT"
                              ? "outline"
                              : "default"
                          }
                          className="text-[10px] px-1.5 py-0.5"
                        >
                          {item.contributionType === "REGULAR"
                            ? "Regular"
                            : item.contributionType === "ADDITIONAL"
                            ? "Additional"
                            : item.contributionType === "REFUND"
                            ? "Refund"
                            : "Adjustment"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-rose-600 font-mono font-medium">
                        {item.debit > 0 ? `৳ ${formatCurrency(item.debit)}` : "-"}
                      </TableCell>
                      <TableCell className="text-right text-emerald-600 font-mono font-medium">
                        {item.credit > 0 ? `৳ ${formatCurrency(item.credit)}` : "-"}
                      </TableCell>
                      <TableCell className="text-right font-bold font-mono">
                        ৳ {formatCurrency(item.balance)}
                      </TableCell>
                      <TableCell>{item.paymentMethod}</TableCell>
                      <TableCell>{item.collector}</TableCell>
                      <TableCell className="max-w-[150px] truncate text-muted-foreground">
                        {item.remarks || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Modal Pagination */}
        {data?.pagination && data.pagination.totalPages > 1 && (
          <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground print:hidden">
            <div>
              Page {data.pagination.page} of {data.pagination.totalPages} ({data.pagination.total} total records)
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => p - 1)}
              >
                <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs"
                disabled={page >= data.pagination.totalPages || loading}
                onClick={() => setPage((p) => p + 1)}
              >
                Next <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Print Layout Component (Visible only when printing) */}
        <div className="hidden print:block">
          <LedgerPrintTemplate
            foundationName={foundationName}
            foundationLogo={foundationLogo}
            title="MEMBER CONTRIBUTION LEDGER STATEMENT"
            subtitle="Foundation ERP Financial Statement"
            dateRangeStr={from || to ? `${from || "Start"} to ${to || "Present"}` : "All Time"}
            printedBy={userName}
            printedTime={new Date().toLocaleString()}
            memberInfo={data?.member}
            previousBalance={data?.summary?.previousBalance || 0}
            items={data?.items || []}
            summary={{
              totalContributions: data?.summary?.totalContributions || 0,
              totalRefund: data?.summary?.totalRefunds || 0,
              totalAdjustment: data?.summary?.totalAdjustments || 0,
              currentBalance: data?.summary?.closingBalance || 0,
              totalTransactions: data?.pagination?.total || 0,
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
