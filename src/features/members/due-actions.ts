"use server"

import { apiClient } from "@/lib/api/client"

export async function generateMissingContributions() {
  try {
    return await apiClient.members.generateMissingContributions()
  } catch (err) {
    console.error("Failed to generate missing contributions:", err)
    return { success: false }
  }
}

export async function getMemberDuesList() {
  try {
    const list = await apiClient.members.getDuesList()
    return list || []
  } catch (err) {
    console.error("Failed to get member dues list:", err)
    return []
  }
}
