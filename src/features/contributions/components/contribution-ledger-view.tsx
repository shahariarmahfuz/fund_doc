"use client"

import { useState, useEffect } from "react"
import { useRbac } from "@/components/providers/rbac-provider"
import {
  getContributionLedger,
  getContributionLedgerFilterOptions,
  exportContributionLedgerCSV,
  type ContributionLedgerItem,
  type LedgerSummaryStats,
} from "../ledger-actions"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatCurrency } from "@/lib/format"
import {
  Search,
  Calendar,
  Filter,
  X,
  Download,
  Printer,
  RotateCcw,
  SlidersHorizontal,
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  FileSpreadsheet,
  FileText,
  FileCode,
  BookOpen,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Scale,
  ListFilter,
  User,
} from "lucide-react"
import { toast } from "sonner"
import { AddRefundDialog } from "./add-refund-dialog"
import { AddAdjustmentDialog } from "./add-adjustment-dialog"
import { MemberLedgerModal } from "./member-ledger-modal"
import { LedgerPrintTemplate } from "./ledger-print-template"

interface ContributionLedgerViewProps {
  foundationName?: string
  foundationLogo?: string | null
  userName?: string
}

export function ContributionLedgerView({
  foundationName = "Foundation ERP",
  foundationLogo,
  userName = "Admin",
}: ContributionLedgerViewProps) {
    const { can } = useRbac()

  const canView = can("Fund Collection", "View")
  const canAdd = can("Fund Collection", "Add")
  const canExport = can("Fund Collection", "Export") || canView

  // State
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<ContributionLedgerItem[]>([])
  const [summary, setSummary] = useState<LedgerSummaryStats>({
    totalContributions: 0,
    totalRefund: 0,
    totalAdjustment: 0,
    currentBalance: 0,
    totalTransactions: 0,
  })
  const [previousBalance, setPreviousBalance] = useState(0)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
    totalPages: 0,
  })

  // Filters State
  const [search, setSearch] = useState("")
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [selectedMember, setSelectedMember] = useState("ALL")
  const [type, setType] = useState("ALL")
  const [collector, setCollector] = useState("ALL")
  const [paymentMethod, setPaymentMethod] = useState("ALL")

  // Filter Options State
  const [filterOptions, setFilterOptions] = useState<{
    members: Array<{ id: string; memberId: string; fullName: string | null }>
    collectors: string[]
    paymentMethods: string[]
  }>({
    members: [],
    collectors: [],
    paymentMethods: [],
  })

  // Dialog & Modal State
  const [refundDialogOpen, setRefundDialogOpen] = useState(false)
  const [adjustmentDialogOpen, setAdjustmentDialogOpen] = useState(false)
  const [selectedMemberForLedger, setSelectedMemberForLedger] = useState<string | null>(null)
  const [memberLedgerOpen, setMemberLedgerOpen] = useState(false)

  // Load Filter Options
  useEffect(() => {
    getContributionLedgerFilterOptions()
      .then((opts) => setFilterOptions(opts))
      .catch((err) => console.error("Error loading filter options:", err))
  }, [])

  // Load Ledger Data
  const loadLedger = async (page = pagination.page, limit = pagination.limit) => {
    setLoading(true)
    try {
      const res = await getContributionLedger({
        search: search || undefined,
        from: from || undefined,
        to: to || undefined,
        memberId: selectedMember !== "ALL" ? selectedMember : undefined,
        type: type !== "ALL" ? type : undefined,
        collector: collector !== "ALL" ? collector : undefined,
        paymentMethod: paymentMethod !== "ALL" ? paymentMethod : undefined,
        page,
        limit,
      })

      setItems(res.items)
      setSummary(res.summary)
      setPreviousBalance(res.previousBalance)
      setPagination(res.pagination)
    } catch (err: any) {
      toast.error(err.message || "Failed to load contribution ledger")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLedger(1, pagination.limit)
  }, [search, from, to, selectedMember, type, collector, paymentMethod])

  const handleResetFilters = () => {
    setSearch("")
    setFrom("")
    setTo("")
    setSelectedMember("ALL")
    setType("ALL")
    setCollector("ALL")
    setPaymentMethod("ALL")
  }

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      loadLedger(newPage, pagination.limit)
    }
  }

  const handleLimitChange = (newLimitStr: string) => {
    const newLimit = parseInt(newLimitStr, 10)
    loadLedger(1, newLimit)
  }

  // Print Full Ledger
  const handlePrintFullLedger = () => {
    window.print()
  }

  // Export Handlers
  const handleExportCSV = async () => {
    try {
      const csvStr = await exportContributionLedgerCSV({
        search: search || undefined,
        from: from || undefined,
        to: to || undefined,
        memberId: selectedMember !== "ALL" ? selectedMember : undefined,
        type: type !== "ALL" ? type : undefined,
        collector: collector !== "ALL" ? collector : undefined,
        paymentMethod: paymentMethod !== "ALL" ? paymentMethod : undefined,
      })

      const blob = new Blob([csvStr], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.setAttribute("href", url)
      link.setAttribute("download", `Contribution_Ledger_${new Date().toISOString().split("T")[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success("Contribution ledger exported to CSV successfully")
    } catch (err: any) {
      toast.error("Failed to export")
    }
  }

  const handleExportExcel = async () => {
    // Standard TSV / Spreadsheet format compatible with Excel
    await handleExportCSV()
  }

  const handleOpenMemberLedger = (memberDbId: string) => {
    setSelectedMemberForLedger(memberDbId)
    setMemberLedgerOpen(true)
  }

  const dateRangeString = from || to ? `${from || "Start"} to ${to || "Present"}` : "All Time"

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-primary" />
            Contribution Ledger
          </h1>
          <p className="text-muted-foreground">
            Chronological ledger tracking all regular and additional contributions, refunds, and adjustments.
          </p>
        </div>

        {/* Top Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {canAdd && (
            <>
              <Button variant="outline" size="sm" onClick={() => setRefundDialogOpen(true)} className="border-rose-300 hover:bg-rose-50 text-rose-700">
                <RotateCcw className="h-4 w-4 mr-1.5" />
                Refund
              </Button>

              <Button variant="outline" size="sm" onClick={() => setAdjustmentDialogOpen(true)} className="border-amber-300 hover:bg-amber-50 text-amber-700">
                <SlidersHorizontal className="h-4 w-4 mr-1.5" />
                Record Adjustment
              </Button>
            </>
          )}

          {canExport && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-1.5" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Select File Format</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleExportExcel}>
                  <FileSpreadsheet className="h-4 w-4 mr-2 text-emerald-600" />
                  Excel (.xlsx / CSV)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportCSV}>
                  <FileCode className="h-4 w-4 mr-2 text-blue-600" />
                  CSV File (.csv)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handlePrintFullLedger}>
                  <FileText className="h-4 w-4 mr-2 text-rose-600" />
                  PDF / Print Report
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <Button variant="default" size="sm" onClick={handlePrintFullLedger}>
            <Printer className="h-4 w-4 mr-1.5" />
            Print Ledger
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 print:hidden">
        <Card className="bg-emerald-500/10 border-emerald-500/20">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Total Contributions</p>
              <h3 className="text-lg sm:text-xl font-bold text-emerald-700 mt-1">
                ৳ {formatCurrency(summary.totalContributions)}
              </h3>
            </div>
            <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-600">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-rose-500/10 border-rose-500/20">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Total Refunds</p>
              <h3 className="text-lg sm:text-xl font-bold text-rose-700 mt-1">
                ৳ {formatCurrency(summary.totalRefund)}
              </h3>
            </div>
            <div className="h-10 w-10 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-600">
              <TrendingDown className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-amber-500/10 border-amber-500/20">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Total Adjustments</p>
              <h3 className="text-lg sm:text-xl font-bold text-amber-700 mt-1">
                ৳ {formatCurrency(summary.totalAdjustment)}
              </h3>
            </div>
            <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-600">
              <Scale className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-500/10 border-blue-500/20">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Current Balance</p>
              <h3 className="text-lg sm:text-xl font-bold text-blue-700 mt-1">
                ৳ {formatCurrency(summary.currentBalance)}
              </h3>
            </div>
            <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-600">
              <DollarSign className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-500/10 border-purple-500/20 col-span-2 lg:col-span-1">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Total Transactions</p>
              <h3 className="text-lg sm:text-xl font-bold text-purple-700 mt-1">
                {summary.totalTransactions}
              </h3>
            </div>
            <div className="h-10 w-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-600">
              <ListFilter className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Toolbar */}
      <Card className="print:hidden">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Filter className="h-4 w-4 text-primary" />
              Ledger Filters & Search
            </div>

            {(search || from || to || selectedMember !== "ALL" || type !== "ALL" || collector !== "ALL" || paymentMethod !== "ALL") && (
              <Button variant="ghost" size="sm" onClick={handleResetFilters} className="text-xs h-7 px-2">
                <X className="h-3.5 w-3.5 mr-1" />
                Reset Filters
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Search Input */}
            <div className="space-y-1.5 col-span-1 sm:col-span-2">
              <Label className="text-xs">Search (Receipt / Member / Phone / Remarks)</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by receipt no, member ID, name or phone..."
                  className="pl-9 text-xs h-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Date From */}
            <div className="space-y-1.5">
              <Label className="text-xs">From Date</Label>
              <Input
                type="date"
                className="text-xs h-9"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </div>

            {/* Date To */}
            <div className="space-y-1.5">
              <Label className="text-xs">To Date</Label>
              <Input
                type="date"
                className="text-xs h-9"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>

            {/* Member Filter */}
            <div className="space-y-1.5">
              <Label className="text-xs">Select Member</Label>
              <Select value={selectedMember} onValueChange={setSelectedMember}>
                <SelectTrigger className="text-xs h-9">
                  <SelectValue placeholder="All Members" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="ALL">All Members</SelectItem>
                  {filterOptions.members.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.memberId} - {m.fullName || "Member"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Contribution Type Filter */}
            <div className="space-y-1.5">
              <Label className="text-xs">Contribution Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="text-xs h-9">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Types</SelectItem>
                  <SelectItem value="REGULAR">Regular Contribution</SelectItem>
                  <SelectItem value="ADDITIONAL">Additional Contribution</SelectItem>
                  <SelectItem value="REFUND">Refund (Refund)</SelectItem>
                  <SelectItem value="ADJUSTMENT">Adjustment</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Collector Filter */}
            <div className="space-y-1.5">
              <Label className="text-xs">Collector</Label>
              <Select value={collector} onValueChange={setCollector}>
                <SelectTrigger className="text-xs h-9">
                  <SelectValue placeholder="All Collectors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Collectors</SelectItem>
                  {filterOptions.collectors.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Payment Method Filter */}
            <div className="space-y-1.5">
              <Label className="text-xs">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="text-xs h-9">
                  <SelectValue placeholder="All Methods" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Methods</SelectItem>
                  <SelectItem value="CASH">Cash (CASH)</SelectItem>
                  <SelectItem value="BANK">Bank (BANK)</SelectItem>
                  <SelectItem value="MOBILE_BANKING">Mobile Banking</SelectItem>
                  {filterOptions.paymentMethods
                    .filter((m) => !["CASH", "BANK", "MOBILE_BANKING"].includes(m))
                    .map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Ledger Table */}
      <Card className="print:hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[100px]">Date</TableHead>
                  <TableHead>Receipt No</TableHead>
                  <TableHead>Member</TableHead>
                  <TableHead>Mobile</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Debit (৳)</TableHead>
                  <TableHead className="text-right">Credit (৳)</TableHead>
                  <TableHead className="text-right font-bold">Balance (৳)</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Collector</TableHead>
                  <TableHead>Remarks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={11} className="h-40 text-center text-muted-foreground">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
                      Loading ledger data...
                    </TableCell>
                  </TableRow>
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="h-32 text-center text-muted-foreground">
                      No contribution ledger records found.
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {/* Previous Balance Row */}
                    {previousBalance !== 0 && (
                      <TableRow className="bg-muted/30 font-medium text-xs">
                        <TableCell colSpan={7} className="italic text-muted-foreground">
                          Opening / Previous Balance
                        </TableCell>
                        <TableCell className="text-right font-bold font-mono">
                          ৳ {formatCurrency(previousBalance)}
                        </TableCell>
                        <TableCell colSpan={3}></TableCell>
                      </TableRow>
                    )}

                    {items.map((item) => (
                      <TableRow key={item.id} className="text-xs hover:bg-muted/40 transition-colors">
                        <TableCell className="whitespace-nowrap font-medium">{item.paymentDate.split("T")[0]}</TableCell>
                        <TableCell className="font-mono text-[11px] font-semibold text-foreground">
                          {item.receiptNo}
                        </TableCell>

                        {/* Member Link */}
                        <TableCell>
                          <button
                            type="button"
                            className="text-left font-medium text-primary hover:underline flex flex-col group"
                            onClick={() => item.memberDbId && handleOpenMemberLedger(item.memberDbId)}
                          >
                            <span className="font-semibold group-hover:text-primary-600">{item.memberName}</span>
                            <span className="text-[10px] text-muted-foreground font-mono">{item.memberId}</span>
                          </button>
                        </TableCell>

                        <TableCell className="text-muted-foreground">{item.mobile}</TableCell>

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

                        {/* Debit */}
                        <TableCell className="text-right font-mono font-medium text-rose-600">
                          {item.debit > 0 ? `৳ ${formatCurrency(item.debit)}` : "-"}
                        </TableCell>

                        {/* Credit */}
                        <TableCell className="text-right font-mono font-medium text-emerald-600">
                          {item.credit > 0 ? `৳ ${formatCurrency(item.credit)}` : "-"}
                        </TableCell>

                        {/* Running Balance */}
                        <TableCell className="text-right font-bold font-mono text-foreground">
                          ৳ {formatCurrency(item.balance)}
                        </TableCell>

                        <TableCell>{item.paymentMethod}</TableCell>
                        <TableCell>{item.collector}</TableCell>
                        <TableCell className="max-w-[160px] truncate text-muted-foreground">
                          {item.remarks || "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls */}
          {pagination.totalPages > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t text-xs">
              <div className="flex items-center gap-2 text-muted-foreground">
                <span>Rows per page:</span>
                <Select value={String(pagination.limit)} onValueChange={handleLimitChange}>
                  <SelectTrigger className="h-8 w-16 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
                <span>
                  Showing {(pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} records
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 text-xs"
                  disabled={pagination.page <= 1 || loading}
                  onClick={() => handlePageChange(pagination.page - 1)}
                >
                  <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                  Previous
                </Button>

                <span className="font-semibold text-foreground px-2">
                  Page {pagination.page} of {pagination.totalPages}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 text-xs"
                  disabled={pagination.page >= pagination.totalPages || loading}
                  onClick={() => handlePageChange(pagination.page + 1)}
                >
                  Next
                  <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs & Modals */}
      <AddRefundDialog
        open={refundDialogOpen}
        onOpenChange={setRefundDialogOpen}
        members={filterOptions.members}
        onSuccess={() => loadLedger()}
      />

      <AddAdjustmentDialog
        open={adjustmentDialogOpen}
        onOpenChange={setAdjustmentDialogOpen}
        members={filterOptions.members}
        onSuccess={() => loadLedger()}
      />

      <MemberLedgerModal
        memberId={selectedMemberForLedger}
        open={memberLedgerOpen}
        onOpenChange={setMemberLedgerOpen}
        foundationName={foundationName}
        foundationLogo={foundationLogo}
        userName={userName}
      />

      {/* Full Print Layout Component */}
      <div className="hidden print:block">
        <LedgerPrintTemplate
          foundationName={foundationName}
          foundationLogo={foundationLogo}
          title="CONTRIBUTION LEDGER REPORT"
          subtitle="Foundation ERP Financial Statement"
          dateRangeStr={dateRangeString}
          printedBy={userName}
          printedTime={new Date().toLocaleString()}
          previousBalance={previousBalance}
          items={items}
          summary={summary}
        />
      </div>
    </div>
  )
}
