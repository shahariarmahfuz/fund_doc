"use server"

import { apiClient, isAuthError, isDatabaseError } from "@/lib/api/client"

export interface MetricComparison {
  current: number
  previous: number | null
  change_percentage: number | null
  has_comparison: boolean
  has_data: boolean
}

export interface GroupDistributionItem {
  name: string
  value: number
}

export interface MonthlyChartItem {
  month: string
  contributions: number
  loans: number
  grants: number
}

export interface DashboardStatsData {
  totalMembers: number
  activeMembers: number
  inactiveMembers: number
  totalGroups: number
  foundationTotalFund: MetricComparison
  totalGroupFunds: MetricComparison
  currentCashBalance: MetricComparison
  totalContributions: MetricComparison
  totalActiveLoans: number
  outstandingLoanAmount: number
  totalGrants: number
  totalBeneficiaries: number
  groupFundDistribution: GroupDistributionItem[]
  monthlyChartData: MonthlyChartItem[]
  isError?: boolean
  isAuthError?: boolean
  isDatabaseError?: boolean
}

const EMPTY_METRIC: MetricComparison = {
  current: 0,
  previous: null,
  change_percentage: null,
  has_comparison: false,
  has_data: false,
}

// Global cache to preserve Last-Known-Good dashboard metrics across hot reloads & serverless workers
const globalStats = globalThis as unknown as {
  __lastKnownGoodStats?: DashboardStatsData | null
}

export async function getDashboardStats(): Promise<DashboardStatsData> {
  let cached: DashboardStatsData | null = globalStats.__lastKnownGoodStats || null

  // Fallback to local filesystem cache across process cold starts
  if (!cached) {
    try {
      const fs = await import("fs/promises")
      const path = await import("path")
      const cachePath = path.join(process.cwd(), ".next", "cache", "dashboard-stats.json")
      const raw = await fs.readFile(cachePath, "utf-8")
      cached = JSON.parse(raw)
      if (cached) {
        globalStats.__lastKnownGoodStats = cached
      }
    } catch {
      // No file cache yet
    }
  }

  try {
    const stats = await apiClient.get<DashboardStatsData>("/api/v1/dashboard/stats", {
      retries: 2,
    })
    if (stats && typeof stats === "object" && stats.foundationTotalFund) {
      globalStats.__lastKnownGoodStats = { ...stats, isError: false }

      // Asynchronously persist to file cache
      try {
        const fs = await import("fs/promises")
        const path = await import("path")
        const cacheDir = path.join(process.cwd(), ".next", "cache")
        await fs.mkdir(cacheDir, { recursive: true })
        await fs.writeFile(
          path.join(cacheDir, "dashboard-stats.json"),
          JSON.stringify(stats),
          "utf-8"
        )
      } catch {
        // Non-fatal if filesystem is read-only
      }

      return { ...stats, isError: false }
    }
    return stats
  } catch (err: any) {
    const authFailed = isAuthError(err) || err?.status === 401 || err?.status === 403

    if (authFailed) {
      console.warn("[Dashboard] Session authentication failed or revoked on backend:", err?.message || err)
      return {
        totalMembers: 0,
        activeMembers: 0,
        inactiveMembers: 0,
        totalGroups: 0,
        foundationTotalFund: { ...EMPTY_METRIC },
        totalGroupFunds: { ...EMPTY_METRIC },
        currentCashBalance: { ...EMPTY_METRIC },
        totalContributions: { ...EMPTY_METRIC },
        totalActiveLoans: 0,
        outstandingLoanAmount: 0,
        totalGrants: 0,
        totalBeneficiaries: 0,
        groupFundDistribution: [],
        monthlyChartData: [],
        isError: true,
        isAuthError: true,
      }
    }

    console.error("[Dashboard] Temporary API synchronization failure:", err)

    // VALID DATA + TEMPORARY API FAILURE = KEEP VALID DATA!
    if (cached) {
      return {
        ...cached,
        isError: true,
        isDatabaseError: true,
      }
    }

    return {
      totalMembers: 0,
      activeMembers: 0,
      inactiveMembers: 0,
      totalGroups: 0,
      foundationTotalFund: { ...EMPTY_METRIC },
      totalGroupFunds: { ...EMPTY_METRIC },
      currentCashBalance: { ...EMPTY_METRIC },
      totalContributions: { ...EMPTY_METRIC },
      totalActiveLoans: 0,
      outstandingLoanAmount: 0,
      totalGrants: 0,
      totalBeneficiaries: 0,
      groupFundDistribution: [],
      monthlyChartData: [],
      isError: true,
      isDatabaseError: true,
    }
  }
}
