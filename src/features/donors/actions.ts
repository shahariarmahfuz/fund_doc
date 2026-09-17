"use server"

import { apiClient } from "@/lib/api/client"
import { revalidatePath } from "next/cache"

export async function getDonors() {
  try {
    return await apiClient.donors.getAll()
  } catch (err) {
    console.error("Failed to fetch donors:", err)
    return []
  }
}

export async function getDonor(id: string) {
  try {
    return await apiClient.donors.getById(id)
  } catch (err) {
    console.error(`Failed to fetch donor ${id}:`, err)
    return null
  }
}

export async function createDonor(data: any) {
  try {
    const donor = await apiClient.donors.create({
      fullName: data.fullName,
      mobile: data.mobile,
      address: data.address || null,
      nationalId: data.nationalId || null,
      notes: data.notes || null,
    })

    revalidatePath("/donors")
    revalidatePath("/donors/manage")
    return { success: true, donor }
  } catch (error: any) {
    console.error("Error creating donor:", error)
    return { success: false, error: error?.message || "Failed to create donor" }
  }
}

export async function updateDonor(id: string, data: any) {
  try {
    const donor = await apiClient.donors.update(id, {
      fullName: data.fullName,
      mobile: data.mobile,
      address: data.address || null,
      nationalId: data.nationalId || null,
      notes: data.notes || null,
    })

    revalidatePath("/donors")
    revalidatePath(`/donors/${id}`)
    return { success: true, donor }
  } catch (error: any) {
    console.error("Error updating donor:", error)
    return { success: false, error: error?.message || "Failed to update donor" }
  }
}

export async function deleteDonor(id: string) {
  try {
    await apiClient.donors.delete(id)
    revalidatePath("/donors")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to delete donor" }
  }
}

export async function getDonorLedger(donorId: string) {
  try {
    const donor = await apiClient.donors.getById(donorId)
    const ledger = await apiClient.ledger.getDonorLedger(donorId)
    return { donor, ledger }
  } catch (err) {
    console.error(`Failed to fetch donor ledger ${donorId}:`, err)
    return { donor: null, ledger: [] }
  }
}

export async function receiveDonation(data: {
  sourceType?: "MEMBER" | "DONOR"
  donorId?: string | null
  memberId?: string | null
  groupId: string
  amount: number
  date: string
  remarks?: string
}) {
  try {
    const result = await apiClient.donors.receive(data)
    revalidatePath("/donors/ledger")
    revalidatePath("/donors/donations")
    revalidatePath("/groups")
    return { success: true, ...result }
  } catch (error: any) {
    console.error("Error receiving donation:", error)
    return { success: false, error: error?.message || "Failed to receive donation" }
  }
}

export type DonationTransactionItem = {
  id: string
  date: string
  voucherNo: string
  sourceType: "MEMBER" | "DONOR"
  donorId: string | null
  donor: {
    id: string
    donorId: string
    fullName: string
    mobile: string
    address: string | null
    nationalId: string | null
  } | null
  memberId: string | null
  member: {
    id: string
    memberId: string
    fullName: string | null
    mobile: string | null
    groupName?: string | null
  } | null
  groupId: string | null
  groupName: string
  amount: number
  remarks: string
  createdBy: string
  status: string
  createdAt: string
}

export async function getReceivedDonations(): Promise<DonationTransactionItem[]> {
  try {
    return await apiClient.get<DonationTransactionItem[]>("/api/v1/donors/donations")
  } catch (err) {
    console.error("Failed to fetch received donations:", err)
    return []
  }
}

export async function deleteDonationTransaction(transactionId: string) {
  try {
    await apiClient.delete(`/api/v1/donors/donations/${transactionId}`)
    revalidatePath("/donors/donations")
    revalidatePath("/donors/ledger")
    return { success: true }
  } catch (error: any) {
    console.error("Error deleting donation transaction:", error)
    return { success: false, error: error?.message || "Failed to delete donation transaction" }
  }
}

export async function updateDonationTransaction(transactionId: string, data: any) {
  try {
    await apiClient.put(`/api/v1/donors/donations/${transactionId}`, data)
    revalidatePath("/donors/donations")
    revalidatePath("/donors/ledger")
    return { success: true }
  } catch (error: any) {
    console.error("Error updating donation transaction:", error)
    return { success: false, error: error?.message || "Failed to update donation transaction" }
  }
}

export async function getMemberDonations(memberId: string) {
  try {
    const all = await apiClient.get<DonationTransactionItem[]>("/api/v1/donors/donations")
    return all
      .filter((d) => d.memberId === memberId)
      .map((d) => ({
        id: d.id,
        date: d.date,
        voucherNo: d.voucherNo,
        groupName: d.groupName,
        amount: d.amount,
        remarks: d.remarks,
      }))
  } catch {
    return []
  }
}
