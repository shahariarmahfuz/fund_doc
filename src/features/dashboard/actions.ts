"use server"

import { apiClient } from "@/lib/api/client"

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
}

const EMPTY_METRIC: MetricComparison = {
  current: 0,
  previous: null,
  change_percentage: null,
  has_comparison: false,
  has_data: false,
}

export async function getDashboardStats(): Promise<DashboardStatsData> {
  try {
    const stats = await apiClient.get<DashboardStatsData>("/api/v1/dashboard/stats")
    return stats
  } catch (err) {
    console.error("Failed to fetch dashboard stats from FastAPI:", err)
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
    }
  }
}

