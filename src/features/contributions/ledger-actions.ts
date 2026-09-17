"use server"

import { apiClient } from "@/lib/api/client"
import { revalidatePath } from "next/cache"
import {
  contributionRefundSchema,
  contributionAdjustmentSchema,
  type ContributionRefundFormValues,
  type ContributionAdjustmentFormValues,
} from "./schema"

export type ContributionLedgerItem = {
  id: string
  paymentDate: string
  receiptNo: string
  memberId: string
  memberDbId: string
  memberName: string
  mobile: string
  contributionType: "REGULAR" | "ADDITIONAL" | "REFUND" | "ADJUSTMENT"
  debit: number
  credit: number
  balance: number
  paymentMethod: string
  collector: string
  remarks: string
}

export type LedgerSummaryStats = {
  totalContributions: number
  totalRefund: number
  totalAdjustment: number
  currentBalance: number
  totalTransactions: number
}

export type ContributionLedgerQueryParams = {
  search?: string
  from?: string
  to?: string
  memberId?: string
  type?: string
  collector?: string
  paymentMethod?: string
  page?: number
  limit?: number
}

export async function getContributionLedger(params: ContributionLedgerQueryParams) {
  try {
    const list = await apiClient.contributions.getAll({
      memberId: params.memberId && params.memberId !== "ALL" ? params.memberId : undefined,
    })

    const items: ContributionLedgerItem[] = []
    let totalContributions = 0
    const totalRefund = 0
    const totalAdjustment = 0
    let runningBalance = 0

    for (const mc of list || []) {
      for (const p of mc.payments || []) {
        const isAdditional = mc.isAdditional
        const credit = p.amount
        const debit = 0
        runningBalance += credit - debit
        totalContributions += p.amount

        items.push({
          id: p.id,
          paymentDate: p.paymentDate,
          receiptNo: p.referenceNumber || `REC-${p.id.slice(0, 8)}`,
          memberId: mc.member?.memberId || "N/A",
          memberDbId: mc.memberId,
          memberName: mc.member?.fullName || "Member",
          mobile: mc.member?.mobile || "-",
          contributionType: isAdditional ? "ADDITIONAL" : "REGULAR",
          debit,
          credit,
          balance: runningBalance,
          paymentMethod: p.paymentMethod || "CASH",
          collector: p.createdBy || "Admin",
          remarks: p.notes || "",
        })
      }
    }

    return {
      items,
      summary: {
        totalContributions,
        totalRefund,
        totalAdjustment,
        currentBalance: totalContributions - totalRefund + totalAdjustment,
        totalTransactions: items.length,
      },
      previousBalance: 0,
      pagination: {
        page: params.page || 1,
        limit: params.limit || 15,
        total: items.length,
        totalPages: Math.ceil(items.length / (params.limit || 15)) || 1,
      },
    }
  } catch (err) {
    console.error("Failed to fetch contribution ledger:", err)
    return {
      items: [],
      summary: {
        totalContributions: 0,
        totalRefund: 0,
        totalAdjustment: 0,
        currentBalance: 0,
        totalTransactions: 0,
      },
      previousBalance: 0,
      pagination: { page: 1, limit: 15, total: 0, totalPages: 0 },
    }
  }
}

export async function getMemberContributionLedger(
  memberId: string,
  params?: { from?: string; to?: string; page?: number; limit?: number }
) {
  try {
    const member = await apiClient.members.getById(memberId)
    const ledger = await apiClient.get<any[]>(`/api/v1/contributions/ledger/${memberId}`)

    let runningBalance = 0
    let totalContributions = 0

    const items: ContributionLedgerItem[] = (ledger || []).map((p: any) => {
      runningBalance += p.amount
      totalContributions += p.amount

      return {
        id: p.id,
        paymentDate: p.paymentDate,
        receiptNo: p.referenceNumber || `REC-${p.id.slice(0, 8)}`,
        memberId: member?.memberId || "N/A",
        memberDbId: memberId,
        memberName: member?.fullName || "Member",
        mobile: member?.mobile || "-",
        contributionType: p.isAdditional ? "ADDITIONAL" : "REGULAR",
        debit: 0,
        credit: p.amount,
        balance: runningBalance,
        paymentMethod: p.paymentMethod || "CASH",
        collector: "Admin",
        remarks: p.notes || "",
      }
    })

    return {
      member: {
        id: member?.id || memberId,
        memberId: member?.memberId || "N/A",
        fullName: member?.fullName || "Member",
        mobile: member?.mobile || "-",
        groupName: member?.group?.name || "General Group",
        groupCode: member?.group?.code || "",
        status: member?.status || "ACTIVE",
      },
      items,
      summary: {
        previousBalance: 0,
        totalContributions,
        totalRefunds: 0,
        totalAdjustments: 0,
        closingBalance: runningBalance,
      },
      pagination: {
        page: params?.page || 1,
        limit: params?.limit || 20,
        total: items.length,
        totalPages: 1,
      },
    }
  } catch (err) {
    console.error("Failed to fetch member contribution ledger:", err)
    throw err
  }
}

export async function createContributionRefund(data: ContributionRefundFormValues) {
  const parsed = contributionRefundSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: "Invalid data provided" }

  try {
    await apiClient.post("/api/v1/contributions/refund", parsed.data)
    revalidatePath("/contributions")
    revalidatePath("/contributions/ledger")
    revalidatePath(`/members/${parsed.data.memberId}`)
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to process refund" }
  }
}

export async function createContributionAdjustment(data: ContributionAdjustmentFormValues) {
  const parsed = contributionAdjustmentSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: "Invalid data provided" }

  try {
    await apiClient.post("/api/v1/contributions/adjustment", parsed.data)
    revalidatePath("/contributions")
    revalidatePath("/contributions/ledger")
    revalidatePath(`/members/${parsed.data.memberId}`)
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to process adjustment" }
  }
}

export async function getContributionLedgerFilterOptions() {
  try {
    return await apiClient.get<any>("/api/v1/contributions/filter-options")
  } catch {
    return { members: [], collectors: [], paymentMethods: [] }
  }
}

export async function exportContributionLedgerCSV(params: ContributionLedgerQueryParams) {
  const result = await getContributionLedger({ ...params, page: 1, limit: 10000 })
  const headers = [
    "Date",
    "Receipt No",
    "Member ID",
    "Member Name",
    "Mobile",
    "Contribution Type",
    "Debit",
    "Credit",
    "Running Balance",
    "Payment Method",
    "Collector",
    "Remarks",
  ]

  const rows = result.items.map((item) => [
    `"${item.paymentDate.split("T")[0]}"`,
    `"${item.receiptNo}"`,
    `"${item.memberId}"`,
    `"${item.memberName}"`,
    `"${item.mobile}"`,
    `"${item.contributionType}"`,
    item.debit,
    item.credit,
    item.balance,
    `"${item.paymentMethod}"`,
    `"${item.collector}"`,
    `"${item.remarks.replace(/"/g, '""')}"`,
  ])

  const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n")
  return csvContent
}
