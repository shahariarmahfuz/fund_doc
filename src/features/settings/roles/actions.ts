"use server"

import { apiClient } from "@/lib/api/client"
import { revalidatePath } from "next/cache"

export async function getRolesAndPermissions() {
  try {
    const [roles, permissions] = await Promise.all([
      apiClient.roles.getAll(),
      apiClient.get<any[]>("/api/v1/roles/permissions"),
    ])

    const rolePermissions: any[] = []
    for (const r of roles || []) {
      for (const p of r.permissions || []) {
        rolePermissions.push({
          roleId: r.id,
          permissionId: p.id,
        })
      }
    }

    return { roles: roles || [], permissions: permissions || [], rolePermissions }
  } catch (err) {
    console.error("Failed to get roles and permissions:", err)
    return { roles: [], permissions: [], rolePermissions: [] }
  }
}

export async function updateRolePermissions(roleId: string, permissionIds: string[]) {
  try {
    await apiClient.put(`/api/v1/roles/${roleId}/permissions`, { permissionIds })
    revalidatePath("/", "layout")
    revalidatePath("/(dashboard)", "layout")
    return { success: true }
  } catch (error: any) {
    console.error("Failed to update role permissions:", error)
    return { success: false, error: error?.message || "Failed to update role permissions" }
  }
}
