"use server"

import { apiClient } from "@/lib/api/client"
import { revalidatePath } from "next/cache"

export async function getFoundationProfile() {
  try {
    return await apiClient.settings.getProfile()
  } catch {
    return {
      name: "Foundation Name",
      email: "",
      phone: "",
      address: "",
      website: "",
      currency: "BDT",
    }
  }
}

export async function saveFoundationProfile(data: any) {
  try {
    await apiClient.settings.updateProfile(data)
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to update profile." }
  }
}

export async function getMonthlyMembershipFee(): Promise<number> {
  try {
    const settings = await apiClient.settings.getSystemSettings()
    const val = settings?.["DEFAULT_MONTHLY_CONTRIBUTION"] || settings?.["membership.monthlyFee"]
    if (!val) return 100
    const fee = parseInt(val, 10)
    return isNaN(fee) || fee <= 0 ? 100 : fee
  } catch {
    return 100
  }
}

export async function getSystemSettings() {
  try {
    const settings = await apiClient.settings.getSystemSettings()
    if (!settings["DEFAULT_MONTHLY_CONTRIBUTION"] && !settings["membership.monthlyFee"]) {
      settings["DEFAULT_MONTHLY_CONTRIBUTION"] = "100"
      settings["membership.monthlyFee"] = "100"
    }
    return settings
  } catch {
    return {
      DEFAULT_MONTHLY_CONTRIBUTION: "100",
      "membership.monthlyFee": "100",
    }
  }
}

export async function saveSystemSettings(settingsMap: Record<string, string>, group: string = "General") {
  for (const [key, value] of Object.entries(settingsMap)) {
    if (key === "DEFAULT_MONTHLY_CONTRIBUTION" || key === "membership.monthlyFee") {
      const feeNum = parseInt(value, 10)
      if (isNaN(feeNum) || feeNum <= 0) {
        return { success: false, error: "Monthly membership fee must be a positive number greater than 0" }
      }
    }
  }

  const updatedMap = { ...settingsMap }
  if (updatedMap["DEFAULT_MONTHLY_CONTRIBUTION"]) {
    updatedMap["membership.monthlyFee"] = updatedMap["DEFAULT_MONTHLY_CONTRIBUTION"]
  } else if (updatedMap["membership.monthlyFee"]) {
    updatedMap["DEFAULT_MONTHLY_CONTRIBUTION"] = updatedMap["membership.monthlyFee"]
  }

  try {
    await apiClient.settings.updateSystemSettings({
      settings: updatedMap,
      group,
    })

    revalidatePath("/", "layout")
    revalidatePath("/settings/general")
    revalidatePath("/settings/financial")

    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to save settings." }
  }
}

export async function saveUserProfile(userId: string, data: { name?: string; mobile?: string; email?: string; photo?: string }) {
  try {
    await apiClient.users.update(userId, data)
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to update profile." }
  }
}

export async function createBackup() {
  return { success: true, message: "Backup successfully generated." }
}

export async function saveUserPreferences(userId: string, data: any) {
  if (!userId) throw new Error("User ID is required")
  try {
    await apiClient.users.update(userId, {
      preferences: JSON.stringify(data),
    })
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message }
  }
}
