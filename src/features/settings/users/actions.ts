"use server"

import { apiClient } from "@/lib/api/client"
import { requirePermission, checkPermission } from "@/lib/rbac"
import { revalidatePath } from "next/cache"

export async function getUsers() {
  if (!await checkPermission("Users", "View")) return []
  try {
    const res = await apiClient.users.getAll()
    return res || []
  } catch (error) {
    console.error("Error fetching users:", error)
    return []
  }
}

export async function getRoles() {
  if (!await checkPermission("Users", "View")) return []
  try {
    const res = await apiClient.roles.getAll()
    return res || []
  } catch (error) {
    console.error("Error fetching roles:", error)
    return []
  }
}

export async function getAllPermissions() {
  if (!await checkPermission("Users", "View")) return []
  try {
    const res = await apiClient.roles.getPermissions()
    return res || []
  } catch (error) {
    console.error("Error fetching permissions:", error)
    return []
  }
}

export async function getUserWithPermissions(userId: string) {
  await requirePermission("Users", "View")
  try {
    return await apiClient.users.getById(userId)
  } catch (error) {
    console.error("Error fetching user with permissions:", error)
    return null
  }
}

export async function createUser(data: any) {
  await requirePermission("Users", "Manage")
  const res = await apiClient.users.create(data)
  revalidatePath("/settings/users")
  return res
}

export async function updateUser(userId: string, data: any) {
  await requirePermission("Users", "Manage")
  const res = await apiClient.users.update(userId, data)
  revalidatePath("/settings/users")
  return res
}

export async function updateUserPermissions(userId: string, permissionIds: string[]) {
  await requirePermission("Users", "Manage")
  const res = await apiClient.users.updatePermissions(userId, permissionIds)
  revalidatePath("/settings/users")
  return res
}

export async function deleteUser(userId: string) {
  await requirePermission("Users", "Manage")
  const res = await apiClient.users.delete(userId)
  revalidatePath("/settings/users")
  return res
}
