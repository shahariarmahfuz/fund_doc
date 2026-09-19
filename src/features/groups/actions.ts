"use server"

import { apiClient } from "@/lib/api/client"
import { groupSchema, type GroupFormValues } from "./schema"
import type { GroupWithCount } from "./types"
import { revalidatePath } from "next/cache"

export async function getGroups(): Promise<GroupWithCount[]> {
  try {
    const groups = await apiClient.groups.getAll()
    return groups || []
  } catch (err: any) {
    console.warn("Failed to fetch groups from FastAPI:", err?.message || err)
    return []
  }
}

export async function getMemberSignupGroups() {
  try {
    const groups = await apiClient.groups.getSignupEligible()
    return groups || []
  } catch (err: any) {
    console.warn("Failed to fetch signup eligible groups:", err?.message || err)
    return []
  }
}

export async function getGroup(id: string) {
  try {
    return await apiClient.groups.getById(id)
  } catch (err) {
    console.error(`Failed to fetch group ${id}:`, err)
    return null
  }
}

export async function createGroup(data: GroupFormValues) {
  const parsed = groupSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: "Invalid data" }
  }

  try {
    const group = await apiClient.groups.create(parsed.data)
    revalidatePath("/groups")
    return { success: true, data: group }
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to create group" }
  }
}

export async function updateGroup(id: string, data: GroupFormValues) {
  const parsed = groupSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: "Invalid data" }

  try {
    const group = await apiClient.groups.update(id, parsed.data)
    revalidatePath("/groups")
    revalidatePath(`/groups/${id}`)
    return { success: true, data: group }
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to update group" }
  }
}

export async function archiveGroup(id: string) {
  try {
    await apiClient.groups.update(id, { status: "INACTIVE" })
    revalidatePath("/groups")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to archive group" }
  }
}

export async function deleteGroup(id: string) {
  try {
    const res = await apiClient.groups.delete(id)
    revalidatePath("/groups")
    revalidatePath("/groups/manage")
    return { success: true, data: res }
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to delete group" }
  }
}

export async function getGroupMembers(groupId: string) {
  try {
    return await apiClient.get<any[]>(`/api/v1/groups/${groupId}/members`)
  } catch {
    return []
  }
}

export async function removeMemberFromGroup(memberId: string) {
  return { success: false, error: "Members must belong to a group. Please reassign the member instead of removing them." }
}

export async function getGroupFundSummary(groupId: string) {
  try {
    return await apiClient.get<any>(`/api/v1/groups/${groupId}/summary`)
  } catch {
    return { currentBalance: 0, totalIncome: 0, totalExpense: 0 }
  }
}

export async function getGroupLedger(groupId: string) {
  try {
    return await apiClient.get<any[]>(`/api/v1/groups/${groupId}/ledger`)
  } catch {
    return []
  }
}

export async function getGroupTransactions(groupId: string) {
  try {
    return await apiClient.get<any[]>(`/api/v1/groups/${groupId}/ledger`)
  } catch {
    return []
  }
}

export async function getGroupLoans(groupId: string) {
  try {
    const loans = await apiClient.loans.getAll()
    return loans.filter((l: any) => l.allocations?.some((a: any) => a.fund?.groupId === groupId))
  } catch {
    return []
  }
}

export async function getGroupLoanSummary(groupId: string) {
  return { totalLent: 0, totalOutstanding: 0, activeLoans: 0 }
}
