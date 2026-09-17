"use server"

import { apiClient } from "@/lib/api/client"
import { grantSchema, type GrantFormValues } from "./schema"
import { revalidatePath } from "next/cache"

export async function createGrant(data: GrantFormValues) {
  const parsed = grantSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: "Invalid data" }
  const pd = parsed.data

  try {
    const grant = await apiClient.grants.issue({
      beneficiaryId: pd.beneficiaryId,
      amount: pd.amount,
      grantReason: pd.grantReason,
      grantDate: new Date(pd.grantDate).toISOString(),
      comment: pd.comment || "",
      allocations: pd.allocations || [],
    })

    revalidatePath("/grants")
    return { success: true, data: grant }
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to create grant" }
  }
}

export async function updateGrant(id: string, data: GrantFormValues) {
  const parsed = grantSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: "Invalid data" }
  const pd = parsed.data

  try {
    const grant = await apiClient.grants.update(id, {
      beneficiaryId: pd.beneficiaryId,
      amount: pd.amount,
      grantReason: pd.grantReason,
      grantDate: new Date(pd.grantDate).toISOString(),
      comment: pd.comment || "",
      allocations: pd.allocations || [],
    })

    revalidatePath(`/grants/${id}`)
    revalidatePath("/grants")
    return { success: true, data: grant }
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to update grant" }
  }
}

export async function getGrants() {
  try {
    return await apiClient.grants.getAll()
  } catch (err) {
    console.error("Failed to fetch grants:", err)
    return []
  }
}

export async function getGrant(id: string) {
  try {
    return await apiClient.grants.getById(id)
  } catch (err) {
    console.error(`Failed to fetch grant ${id}:`, err)
    return null
  }
}

export async function deleteGrant(id: string) {
  try {
    await apiClient.grants.delete(id)
    revalidatePath("/grants")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to delete grant" }
  }
}
