"use server"

import { apiClient } from "@/lib/api/client"

export async function getFoundationSummaryReport() {
  try {
    const summary = await apiClient.reports.getSummary()
    return summary?.funds || []
  } catch (err) {
    console.error("Failed to fetch foundation summary report:", err)
    return []
  }
}

export async function getGeneralLedgerReport() {
  try {
    const txs = await apiClient.ledger.getTransactions()
    return txs || []
  } catch (err) {
    console.error("Failed to fetch general ledger report:", err)
    return []
  }
}

export async function getMemberDirectoryReport() {
  try {
    const members = await apiClient.members.getAll()
    return (members || []).map((m: any) => ({
      memberId: m.memberId,
      name: m.fullName || "Name not found",
      group: m.group?.name || "No Group",
      mobile: m.mobile,
      email: m.email || "N/A",
      status: m.status,
      joinDate: m.joinDate,
    }))
  } catch (err) {
    console.error("Failed to fetch member directory report:", err)
    return []
  }
}
