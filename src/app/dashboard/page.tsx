import { formatCurrency } from "@/lib/format"
import { getDashboardStats, MetricComparison } from "@/features/dashboard/actions"

import { getAuthSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { KpiCard } from "@/components/ui/kpi-card"
import {
  Wallet,
  TrendingUp,
  Coins,
  Minus,
  LineChart,
  RefreshCcw,
  TrendingDown,
  Users,
  Building2,
  Landmark,
  Gift,
  AlertCircle
} from "lucide-react"

import { Suspense } from "react"

export default async function DashboardPage() {
  const session = await getAuthSession()
  const user = session?.user as any
  if (!user?.id) redirect("/login")
  
  return (
    <div className="space-y-4">
        {/* Page Header (Loads Instantly) */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 animate-fade-up delay-1">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-[22px] font-bold text-surface-950 tracking-tight">Executive Dashboard</h2>
              <span className="badge-custom bg-accent-green/10 text-accent-emerald">
                <span className="w-1.5 h-1.5 bg-accent-green rounded-full" style={{ animation: 'pulse-soft 2s infinite' }}></span>
                Live</span>
            </div>
            <p className="text-[13px] text-surface-500">Summary of foundation activities and financial status</p>
          </div>
        </div>

        <Suspense fallback={<DashboardSkeleton />}>
          <DashboardStats />
        </Suspense>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6 animate-pulse">
      {/* Row 1 Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-4">
        {[...Array(4)].map((_, i) => (
          <div key={`r1-${i}`} className="h-32 bg-surface-100/50 rounded-xl border border-surface-200/50 p-5 flex flex-col justify-between shadow-sm">
            <div className="flex justify-between items-start">
              <div className="h-4 w-24 bg-surface-200 rounded"></div>
              <div className="h-8 w-8 bg-surface-200 rounded-full"></div>
            </div>
            <div className="space-y-2 mt-4">
              <div className="h-7 w-32 bg-surface-200 rounded"></div>
              <div className="h-3 w-16 bg-surface-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Row 2 Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={`r2-${i}`} className="h-32 bg-surface-100/50 rounded-xl border border-surface-200/50 p-5 flex flex-col justify-between shadow-sm">
            <div className="flex justify-between items-start">
              <div className="h-4 w-28 bg-surface-200 rounded"></div>
              <div className="h-8 w-8 bg-surface-200 rounded-full"></div>
            </div>
            <div className="space-y-2 mt-4">
              <div className="h-7 w-20 bg-surface-200 rounded"></div>
              <div className="h-3 w-24 bg-surface-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function getFinancialCardDisplay(metric?: MetricComparison) {
  if (!metric || !metric.has_data || (metric.current === 0 && !metric.has_comparison && metric.previous == null)) {
    return {
      value: (
        <>
          ৳0<span className="text-[18px] text-surface-500 font-medium">.00</span>
        </>
      ),
      subValue: "No data available",
      badgeLabel: undefined,
      badgeIcon: undefined,
      badgeVariant: "neutral" as const,
    }
  }

  const value = (
    <>
      ৳{formatCurrency(metric.current)}
      <span className="text-[18px] text-surface-500 font-medium">.00</span>
    </>
  )

  if (metric.has_comparison && metric.previous != null && metric.change_percentage != null) {
    const isUp = metric.change_percentage > 0
    const isDown = metric.change_percentage < 0
    const prefix = isUp ? "+" : ""
    return {
      value,
      subValue: `Compared to last month ৳${formatCurrency(metric.previous)}`,
      badgeLabel: `${prefix}${metric.change_percentage.toFixed(1)}%`,
      badgeIcon: isUp ? TrendingUp : isDown ? TrendingDown : Minus,
      badgeVariant: isUp ? ("up" as const) : isDown ? ("down" as const) : ("neutral" as const),
    }
  }

  return {
    value,
    subValue: "No previous-period data",
    badgeLabel: undefined,
    badgeIcon: undefined,
    badgeVariant: "neutral" as const,
  }
}

async function DashboardStats() {
  const stats = await getDashboardStats()
  const cashDisplay = getFinancialCardDisplay(stats.currentCashBalance)
  const foundationDisplay = getFinancialCardDisplay(stats.foundationTotalFund)
  const groupDisplay = getFinancialCardDisplay(stats.totalGroupFunds)
  const contribDisplay = getFinancialCardDisplay(stats.totalContributions)

  const membersHasData = stats.totalMembers > 0
  const institutionsHasData = stats.totalGroups > 0 || stats.totalBeneficiaries > 0
  const loansHasData = stats.totalActiveLoans > 0 || stats.outstandingLoanAmount > 0
  const grantsHasData = stats.totalGrants > 0

  return (
    <>
      {stats.isError && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 text-sm animate-fade-up">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div>
            <p className="font-medium">Backend Service Notice</p>
            <p className="text-xs text-amber-600/80 mt-0.5">
              Unable to synchronize with backend services. Displaying default empty state.
            </p>
          </div>
        </div>
      )}

      {/* KPI Cards Row 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Cash Balance */}
        <KpiCard
          title="Total Cash Balance"
          value={cashDisplay.value}
          subValue={cashDisplay.subValue}
          icon={Wallet}
          badgeLabel={cashDisplay.badgeLabel}
          badgeIcon={cashDisplay.badgeIcon}
          badgeVariant={cashDisplay.badgeVariant}
          delayClass="delay-1"
          accentColor="#6366f1"
          shadowHover="rgba(99, 102, 241, 0.1)"
          dotColor="#6366f1"
        />

        {/* Foundation Fund */}
        <KpiCard
          title="Foundation Fund"
          value={foundationDisplay.value}
          subValue={foundationDisplay.subValue}
          icon={Coins}
          badgeLabel={foundationDisplay.badgeLabel}
          badgeIcon={foundationDisplay.badgeIcon}
          badgeVariant={foundationDisplay.badgeVariant}
          delayClass="delay-2"
          accentColor="#ec4899"
          shadowHover="rgba(236, 72, 153, 0.1)"
          dotColor="#ec4899"
        />

        {/* Group Funds */}
        <KpiCard
          title="Group Funds"
          value={groupDisplay.value}
          subValue={groupDisplay.subValue}
          icon={LineChart}
          badgeLabel={groupDisplay.badgeLabel}
          badgeIcon={groupDisplay.badgeIcon}
          badgeVariant={groupDisplay.badgeVariant}
          delayClass="delay-3"
          accentColor="#06b6d4"
          shadowHover="rgba(6, 182, 212, 0.1)"
          dotColor="#06b6d4"
        />

        {/* Monthly Contributions */}
        <KpiCard
          title="Monthly Contributions"
          value={contribDisplay.value}
          subValue={contribDisplay.subValue}
          icon={RefreshCcw}
          badgeLabel={contribDisplay.badgeLabel}
          badgeIcon={contribDisplay.badgeIcon}
          badgeVariant={contribDisplay.badgeVariant}
          delayClass="delay-4"
          accentColor="#f59e0b"
          shadowHover="rgba(245, 158, 11, 0.1)"
          dotColor="#f59e0b"
        />
      </div>

      {/* KPI Cards Row 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-4 sm:mt-6">
        {/* Members */}
        <KpiCard
          title="Members"
          value={stats.totalMembers.toString()}
          subValue={
            membersHasData
              ? stats.inactiveMembers > 0
                ? `${stats.inactiveMembers} Inactive Members`
                : "All members active"
              : "No data available"
          }
          icon={Users}
          badgeLabel={membersHasData ? <>{stats.activeMembers} Active</> : undefined}
          badgeVariant="info"
          delayClass="delay-5"
          accentColor="#3b82f6"
          shadowHover="rgba(59, 130, 246, 0.1)"
          dotColor="#3b82f6"
        />

        {/* Groups / Beneficiaries */}
        <KpiCard
          title="Groups / Beneficiaries"
          value={
            institutionsHasData ? (
              <>
                {stats.totalGroups} <span className="text-[18px] text-surface-400 font-normal">/</span>{" "}
                <span className="text-[32px]">{stats.totalBeneficiaries}</span>
              </>
            ) : (
              "0 / 0"
            )
          }
          subValue={institutionsHasData ? "Active institutions" : "No data available"}
          icon={Building2}
          badgeLabel={institutionsHasData ? "Total" : undefined}
          badgeVariant="neutral"
          delayClass="delay-6"
          accentColor="#f43f5e"
          shadowHover="rgba(244, 63, 94, 0.1)"
          dotColor="#f43f5e"
        />

        {/* Active Loans */}
        <KpiCard
          title="Active Qard Hasan"
          value={stats.totalActiveLoans.toString()}
          subValue={
            loansHasData
              ? stats.outstandingLoanAmount === 0
                ? "No dues"
                : <>৳{formatCurrency(stats.outstandingLoanAmount)} Dues</>
              : "No data available"
          }
          icon={Landmark}
          badgeLabel={
            loansHasData && stats.outstandingLoanAmount > 0
              ? `৳${formatCurrency(stats.outstandingLoanAmount)}`
              : undefined
          }
          badgeVariant="neutral"
          delayClass="delay-7"
          accentColor="#10b981"
          shadowHover="rgba(16, 185, 129, 0.1)"
          dotColor="#10b981"
        />

        {/* Total Sadaqah */}
        <KpiCard
          title="Total Sadaqah"
          value={stats.totalGrants.toString()}
          subValue={
            grantsHasData
              ? stats.totalGrants === 0
                ? "No active Sadaqah"
                : "Approved Sadaqah"
              : "No data available"
          }
          icon={Gift}
          badgeLabel={grantsHasData ? "Approved" : undefined}
          badgeVariant="neutral"
          delayClass="delay-8"
          accentColor="#a855f7"
          shadowHover="rgba(168, 85, 247, 0.1)"
          dotColor="#a855f7"
        />
      </div>
    </>
  )
}

