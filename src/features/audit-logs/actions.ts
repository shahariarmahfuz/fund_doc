"use server"

import { apiClient } from "@/lib/api/client"

export async function getAuditLogs() {
  try {
    return await apiClient.auditLogs.getAll()
  } catch (err) {
    console.error("Failed to fetch audit logs:", err)
    return []
  }
}
