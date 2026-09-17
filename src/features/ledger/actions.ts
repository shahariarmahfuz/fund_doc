"use server"

import { apiClient } from "@/lib/api/client"

export async function getMemberLedger(memberId: string) {
  try {
    const member = await apiClient.members.getById(memberId)
    if (!member) throw new Error("Member not found")

    const rows = await apiClient.ledger.getMemberLedger(memberId)

    // Sort chronologically (oldest first)
    const sorted = [...(rows || [])].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )

    let currentBalance = 0
    const ledgerData = sorted.map((r) => {
      currentBalance += r.deposit
      currentBalance -= r.withdrawal
      return {
        ...r,
        balance: currentBalance,
      }
    })

    return {
      member: {
        id: member.id,
        memberId: member.memberId,
        fullName: member.fullName,
        groupName: member.group?.name || "-",
        groupCode: member.group?.code || "-",
        joinDate: member.createdAt,
        status: member.status,
      },
      ledger: ledgerData,
    }
  } catch (err) {
    console.error(`Failed to fetch member ledger ${memberId}:`, err)
    throw err
  }
}
