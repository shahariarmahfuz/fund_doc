import { getAuthSession } from "./auth"
import { hasPermission, isSuperAdminRole } from "./rbac-client"
import { apiClient } from "./api/client"
import { cache } from "react"
import { redirect } from "next/navigation"

/**
 * Fetch all permissions for a user (from session or FastAPI)
 */
export const getUserPermissions = cache(async (userId: string): Promise<string[]> => {
  if (!userId) return []

  const session = await getAuthSession()
  if (session?.user?.id === userId && (session as any).permissions) {
    return (session as any).permissions
  }

  try {
    const user = await apiClient.users.getById(userId)
    if (!user || !user.role) return []

    if (isSuperAdminRole(user.role.name)) {
      return ["*"]
    }

    const permissions = new Set<string>()
    if (user.role.permissions) {
      user.role.permissions.forEach((rp: any) => {
        if (rp.permission) {
          permissions.add(`${rp.permission.module}:${rp.permission.action}`)
        }
      })
    }
    return Array.from(permissions)
  } catch (err) {
    console.error("[RBAC] Failed to fetch user permissions:", err)
    return []
  }
})

/**
 * Fetch user preferences (cached per request to avoid duplicate queries)
 */
export const getUserPreferences = cache(async (userId: string) => {
  if (!userId) return null

  try {
    const user = await apiClient.users.getById(userId)
    if (!user?.preferences) return null
    return JSON.parse(user.preferences) as { dateFormat?: string; timezone?: string }
  } catch {
    return null
  }
})

export { hasPermission, isSuperAdminRole }

/**
 * Helper to log and redirect on unauthorized access
 */
async function handleUnauthorized(userId: string, module: string, action: string) {
  try {
    await apiClient.auditLogs.create({
      action: "UNAUTHORIZED_ACCESS",
      module: module,
      remarks: `Attempted to ${action} on module ${module} without permission`,
    })
  } catch (e) {
    console.error("[RBAC] Failed to log audit:", e)
  }

  redirect(`/unauthorized?module=${encodeURIComponent(module)}&action=${encodeURIComponent(action)}`)
}

/**
 * Server-side guard to require authentication and a specific permission.
 * Redirects if unauthorized.
 */
export async function requirePermission(module: string, action: string) {
  const session = await getAuthSession()
  const user = session?.user as any
  if (!user?.id) {
    redirect("/login")
  }

  const userId = user.id
  const userRole = user.role

  if (isSuperAdminRole(userRole)) {
    return user
  }

  const permissions = (session as any).permissions || (await getUserPermissions(userId))
  const isAllowed = hasPermission(permissions, module, action, userRole)

  if (!isAllowed) {
    await handleUnauthorized(userId, module, action)
  }

  return user
}

/**
 * Page-level guard to redirect to 403 if unauthorized.
 */
export async function authorizePage(module: string, action: string) {
  const session = await getAuthSession()
  const user = session?.user as any
  if (!user?.id) {
    redirect("/login")
  }

  const userId = user.id
  const userRole = user.role

  if (isSuperAdminRole(userRole)) {
    return { session, permissions: ["*"] }
  }

  const permissions = (session as any).permissions || (await getUserPermissions(userId))
  const isAllowed = hasPermission(permissions, module, action, userRole)

  if (!isAllowed) {
    await handleUnauthorized(userId, module, action)
  }

  return { session, permissions }
}

/**
 * Non-redirecting server-side permission checker for safe data loading.
 */
export async function checkPermission(module: string, action: string): Promise<boolean> {
  const session = await getAuthSession()
  const user = session?.user as any
  if (!user?.id) return false

  const userRole = user.role

  if (isSuperAdminRole(userRole)) {
    return true
  }

  const permissions = (session as any).permissions || (await getUserPermissions(user.id))
  return hasPermission(permissions, module, action, userRole)
}
