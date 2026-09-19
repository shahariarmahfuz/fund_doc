/**
 * Central API Client for communicating with the FastAPI backend.
 * Next.js frontend connects EXCLUSIVELY to FastAPI via REST API.
 * ZERO direct database connections.
 */

function getBaseUrl(): string {
  if (typeof window !== "undefined") {
    // In browser: always use same-origin relative URLs so requests route through NGINX
    return ""
  }
  // In server-side Node.js: call internal FastAPI directly on loopback
  return (
    process.env.FASTAPI_INTERNAL_URL ||
    process.env.API_URL ||
    "http://127.0.0.1:8000"
  )
}

export class ApiError extends Error {
  code?: string
  status?: number
  details?: any

  constructor(message: string, code?: string, status?: number, details?: any) {
    super(message)
    this.name = "ApiError"
    this.code = code
    this.status = status
    this.details = details
  }
}

async function getSessionToken(): Promise<string | undefined> {
  if (typeof window !== "undefined") {
    return undefined
  }
  try {
    const { getAuthSession } = await import("@/lib/auth")
    const session = await getAuthSession()
    return (session as any)?.accessToken
  } catch {
    return undefined
  }
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function isAuthError(err: any): boolean {
  return err instanceof ApiError && [401, 403].includes(err.status || 0)
}

export function isDatabaseError(err: any): boolean {
  return (
    (err instanceof ApiError && err.status === 503) ||
    err?.code === "DATABASE_UNAVAILABLE" ||
    err?.code === "SERVICE_UNAVAILABLE"
  )
}

export function isNetworkError(err: any): boolean {
  return err instanceof ApiError && (err.status === 0 || err.code === "NETWORK_ERROR")
}

const PUBLIC_PREFIXES = [
  "/api/v1/settings/branding",
  "/api/v1/groups/signup-eligible",
  "/api/v1/member-requests/public/",
  "/api/v1/member-requests/by-application/",
  "/api/v1/auth/login",
  "/api/v1/auth/refresh",
  "/api/health",
  "/api/v1/health",
  "/health",
]

export function isPublicEndpoint(endpoint: string): boolean {
  const clean = endpoint.startsWith("/") ? endpoint : `/${endpoint}`
  return PUBLIC_PREFIXES.some((prefix) => clean.startsWith(prefix))
}

let activeRefreshPromise: Promise<string | null> | null = null
let lastFailedRefreshTime = 0
const REFRESH_COOLDOWN_MS = 15000

async function refreshAuthToken(): Promise<string | null> {
  if (Date.now() - lastFailedRefreshTime < REFRESH_COOLDOWN_MS) {
    return null
  }

  if (activeRefreshPromise) {
    return activeRefreshPromise
  }

  activeRefreshPromise = (async () => {
    try {
      console.log("[AUTH_REFRESH_STARTED] apiClient attempting token refresh...")
      if (typeof window === "undefined") {
        const { getAuthSession } = await import("@/lib/auth")
        const session = await getAuthSession()
        const currentToken = (session as any)?.accessToken
        const refreshToken = (session as any)?.refreshToken || currentToken
        if (!refreshToken) {
          lastFailedRefreshTime = Date.now()
          console.warn("[AUTH_REFRESH_FAILED] No refresh token available in session")
          return null
        }

        const baseUrl = getBaseUrl()
        const res = await fetch(`${baseUrl.replace(/\/$/, "")}/api/v1/auth/refresh`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${refreshToken}`,
          },
          body: JSON.stringify({ refreshToken }),
        })

        if (!res.ok) {
          lastFailedRefreshTime = Date.now()
          console.warn(`[AUTH_REFRESH_FAILED] Server returned status ${res.status}`)
          return null
        }
        const json = await res.json()
        const data = json?.data || json
        const newToken = data?.access_token
        if (newToken && session) {
          (session as any).accessToken = newToken
          if (data.refresh_token) {
            (session as any).refreshToken = data.refresh_token
          }
        }
        console.log("[AUTH_REFRESH_SUCCESS] Server-side token refresh succeeded")
        return newToken || null
      } else {
        const res = await fetch("/api/v1/auth/refresh", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        })
        if (!res.ok) {
          lastFailedRefreshTime = Date.now()
          console.warn(`[AUTH_REFRESH_FAILED] Client-side refresh returned status ${res.status}`)
          return null
        }
        const json = await res.json()
        const data = json?.data || json
        console.log("[AUTH_REFRESH_SUCCESS] Client-side token refresh succeeded")
        return data?.access_token || null
      }
    } catch (err) {
      lastFailedRefreshTime = Date.now()
      console.warn("[AUTH_REFRESH_FAILED] Token refresh failed:", err)
      return null
    } finally {
      activeRefreshPromise = null
    }
  })()

  return activeRefreshPromise
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit & { token?: string; tags?: string[]; revalidate?: number | false; retries?: number; _isRetryAfterRefresh?: boolean } = {}
): Promise<T> {
  const { token: explicitToken, tags, revalidate, retries = 2, headers: customHeaders, _isRetryAfterRefresh = false, ...fetchOptions } = options

  const baseUrl = getBaseUrl()
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`
  const url = baseUrl ? `${baseUrl.replace(/\/$/, "")}${cleanEndpoint}` : cleanEndpoint

  // Public endpoints NEVER require or wait for an authenticated user session
  const isPublic = isPublicEndpoint(cleanEndpoint)
  const token = isPublic ? undefined : (explicitToken || (await getSessionToken()))

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(customHeaders as Record<string, string>),
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  const nextOptions: any = {}
  if (tags && tags.length > 0) {
    nextOptions.tags = tags
  }
  if (revalidate !== undefined) {
    nextOptions.revalidate = revalidate
  }

  const isGet = (fetchOptions.method || "GET").toUpperCase() === "GET"
  const maxAttempts = isGet ? Math.max(1, retries + 1) : 1

  let lastError: ApiError | null = null

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      if (attempt > 0) {
        // Small exponential delay (500ms, 1000ms) for transient network/server blips
        await sleep(500 * Math.pow(2, attempt - 1))
      }

      const res = await fetch(url, {
        ...fetchOptions,
        headers,
        ...(Object.keys(nextOptions).length > 0 ? { next: nextOptions } : {}),
      })

      // Log diagnostic API events
      if (res.status === 401) {
        console.warn(`[API_401] endpoint=${cleanEndpoint} status=401`)
      } else if (res.status === 403) {
        console.warn(`[API_403] endpoint=${cleanEndpoint} status=403`)
      } else if (res.status === 405) {
        console.error(`[API_405] Method Not Allowed: method=${fetchOptions.method || "GET"} endpoint=${cleanEndpoint}`)
      } else if (res.status === 500) {
        console.error(`[API_500] endpoint=${cleanEndpoint} status=500`)
      } else if (res.status === 503) {
        console.warn(`[API_503] endpoint=${cleanEndpoint} status=503 [DATABASE_ERROR]`)
      }

      // Intercept 401 Unauthorized for automatic token refresh (only for protected endpoints, not public or already retried)
      if (res.status === 401 && !isPublic && !cleanEndpoint.startsWith("/api/v1/auth/") && !_isRetryAfterRefresh) {
        const refreshedToken = await refreshAuthToken()
        if (refreshedToken) {
          return apiRequest<T>(endpoint, {
            ...options,
            token: refreshedToken,
            _isRetryAfterRefresh: true,
          })
        }
      }

      // Retry on 502 Bad Gateway, 503 Service Unavailable, 504 Gateway Timeout for idempotent GET requests
      if (!res.ok && isGet && [502, 503, 504].includes(res.status) && attempt < maxAttempts - 1) {
        continue
      }

      let json: any = null
      const text = await res.text()
      if (text) {
        try {
          json = JSON.parse(text)
        } catch {
          json = { raw: text }
        }
      }

      if (!res.ok) {
        const message =
          json?.detail ||
          json?.error?.message ||
          json?.message ||
          `HTTP error ${res.status}: ${res.statusText}`
        const code = json?.error?.code || json?.code || `HTTP_${res.status}`
        throw new ApiError(message, code, res.status, json?.error?.details || json?.detail)
      }

      if (json && typeof json === "object" && "success" in json) {
        return json.data as T
      }

      return json as T
    } catch (err: any) {
      if (err instanceof ApiError) {
        // If 401/403 or non-retriable error, rethrow immediately
        if ([401, 403, 404, 422].includes(err.status || 0) || !isGet || attempt === maxAttempts - 1) {
          throw err
        }
        lastError = err
      } else {
        const netErr = new ApiError(
          `Network request failed to ${url}: ${err?.message || "Unknown error"}`,
          "NETWORK_ERROR",
          0
        )
        if (!isGet || attempt === maxAttempts - 1) {
          throw netErr
        }
        lastError = netErr
      }
    }
  }

  throw lastError || new ApiError(`Request failed to ${url}`, "UNKNOWN_ERROR", 0)
}

export const apiClient = {
  get: <T>(endpoint: string, options?: { token?: string; tags?: string[]; revalidate?: number | false; retries?: number }) =>
    apiRequest<T>(endpoint, { method: "GET", ...options }),

  post: <T>(endpoint: string, body?: any, options?: { token?: string }) =>
    apiRequest<T>(endpoint, {
      method: "POST",
      body: body !== undefined ? JSON.stringify(body) : undefined,
      ...options,
    }),

  put: <T>(endpoint: string, body?: any, options?: { token?: string }) =>
    apiRequest<T>(endpoint, {
      method: "PUT",
      body: body !== undefined ? JSON.stringify(body) : undefined,
      ...options,
    }),

  patch: <T>(endpoint: string, body?: any, options?: { token?: string }) =>
    apiRequest<T>(endpoint, {
      method: "PATCH",
      body: body !== undefined ? JSON.stringify(body) : undefined,
      ...options,
    }),

  delete: <T>(endpoint: string, options?: { token?: string }) =>
    apiRequest<T>(endpoint, { method: "DELETE", ...options }),

  // ---------------------------------------------------------------------------
  // AUTH
  // ---------------------------------------------------------------------------
  auth: {
    login: (credentials: { username: string; password: string; rememberMe?: boolean; device?: string; browser?: string; os?: string }) =>
      apiClient.post<any>("/api/v1/auth/login", credentials),

    getMe: (token?: string) =>
      apiClient.get<any>("/api/v1/auth/me", { token }),

    refresh: (data?: { refreshToken?: string; refresh_token?: string }, options?: { token?: string }) =>
      apiClient.post<any>("/api/v1/auth/refresh", data, options),

    logout: (token?: string) =>
      apiClient.post<any>("/api/v1/auth/logout", undefined, { token }),
  },

  // ---------------------------------------------------------------------------
  // DASHBOARD
  // ---------------------------------------------------------------------------
  dashboard: {
    getMetrics: (period: string = "monthly") =>
      apiClient.get<any>(`/api/v1/dashboard/metrics?period=${period}`),

    getChart: (period: string = "monthly") =>
      apiClient.get<any>(`/api/v1/dashboard/chart?period=${period}`),

    getActivities: (limit: number = 5) =>
      apiClient.get<any[]>(`/api/v1/dashboard/activities?limit=${limit}`),
  },

  // ---------------------------------------------------------------------------
  // MEMBERS
  // ---------------------------------------------------------------------------
  members: {
    getAll: (params?: { groupId?: string; status?: string }) => {
      const q = new URLSearchParams()
      if (params?.groupId) q.append("groupId", params.groupId)
      if (params?.status) q.append("status", params.status)
      const qs = q.toString()
      return apiClient.get<any[]>(`/api/v1/members${qs ? `?${qs}` : ""}`)
    },

    getById: (id: string) =>
      apiClient.get<any>(`/api/v1/members/${id}`),

    create: (data: any) =>
      apiClient.post<any>("/api/v1/members", data),

    update: (id: string, data: any) =>
      apiClient.put<any>(`/api/v1/members/${id}`, data),

    delete: (id: string) =>
      apiClient.delete<any>(`/api/v1/members/${id}`),

    getStatusHistory: (id: string) =>
      apiClient.get<any[]>(`/api/v1/members/${id}/history`),

    getDuesList: () =>
      apiClient.get<any[]>("/api/v1/members/dues/list"),

    generateMissingContributions: () =>
      apiClient.post<any>("/api/v1/members/dues/generate"),
  },

  // ---------------------------------------------------------------------------
  // MEMBER REQUESTS
  // ---------------------------------------------------------------------------
  memberRequests: {
    getAll: (status?: string) => {
      const qs = status ? `?status=${encodeURIComponent(status)}` : ""
      return apiClient.get<any[]>(`/api/v1/member-requests${qs}`)
    },

    getById: (id: string) =>
      apiClient.get<any>(`/api/v1/member-requests/${id}`),

    create: (data: any) =>
      apiClient.post<any>("/api/v1/member-requests", data),

    updateStatus: (id: string, data: { status: string; adminMessage?: string; rejectionReason?: string }) =>
      apiClient.post<any>(`/api/v1/member-requests/${id}/status`, data),
  },

  // ---------------------------------------------------------------------------
  // GROUPS
  // ---------------------------------------------------------------------------
  groups: {
    getAll: (status?: string) => {
      const qs = status ? `?status=${encodeURIComponent(status)}` : ""
      return apiClient.get<any[]>(`/api/v1/groups${qs}`)
    },

    getById: (id: string) =>
      apiClient.get<any>(`/api/v1/groups/${id}`),

    create: (data: any) =>
      apiClient.post<any>("/api/v1/groups", data),

    update: (id: string, data: any) =>
      apiClient.put<any>(`/api/v1/groups/${id}`, data),

    delete: (id: string) =>
      apiClient.delete<any>(`/api/v1/groups/${id}`),

    getBalance: (id: string) =>
      apiClient.get<{ groupId: string; groupName: string; currentBalance: number }>(`/api/v1/groups/${id}/balance`),
  },

  // ---------------------------------------------------------------------------
  // BENEFICIARIES
  // ---------------------------------------------------------------------------
  beneficiaries: {
    getAll: (status?: string) => {
      const qs = status ? `?status=${encodeURIComponent(status)}` : ""
      return apiClient.get<any[]>(`/api/v1/beneficiaries${qs}`)
    },

    getById: (id: string) =>
      apiClient.get<any>(`/api/v1/beneficiaries/${id}`),

    create: (data: any) =>
      apiClient.post<any>("/api/v1/beneficiaries", data),

    update: (id: string, data: any) =>
      apiClient.put<any>(`/api/v1/beneficiaries/${id}`, data),

    delete: (id: string) =>
      apiClient.delete<any>(`/api/v1/beneficiaries/${id}`),
  },

  // ---------------------------------------------------------------------------
  // DONORS
  // ---------------------------------------------------------------------------
  donors: {
    getAll: (status?: string) => {
      const qs = status ? `?status=${encodeURIComponent(status)}` : ""
      return apiClient.get<any[]>(`/api/v1/donors${qs}`)
    },

    getById: (id: string) =>
      apiClient.get<any>(`/api/v1/donors/${id}`),

    create: (data: any) =>
      apiClient.post<any>("/api/v1/donors", data),

    update: (id: string, data: any) =>
      apiClient.put<any>(`/api/v1/donors/${id}`, data),

    delete: (id: string) =>
      apiClient.delete<any>(`/api/v1/donors/${id}`),

    receive: (data: any) =>
      apiClient.post<any>("/api/v1/donors/receive", data),

    getAllDonations: () =>
      apiClient.get<any[]>("/api/v1/donors/donations/all"),
  },

  // ---------------------------------------------------------------------------
  // CONTRIBUTIONS
  // ---------------------------------------------------------------------------
  contributions: {
    getAll: (params?: { memberId?: string; year?: number; month?: number }) => {
      const q = new URLSearchParams()
      if (params?.memberId) q.append("memberId", params.memberId)
      if (params?.year) q.append("year", String(params.year))
      if (params?.month) q.append("month", String(params.month))
      const qs = q.toString()
      return apiClient.get<any[]>(`/api/v1/contributions${qs ? `?${qs}` : ""}`)
    },

    pay: (data: any) =>
      apiClient.post<any>("/api/v1/contributions/pay", data),

    getSummary: (params?: { year?: number; month?: number }) => {
      const q = new URLSearchParams()
      if (params?.year) q.append("year", String(params.year))
      if (params?.month) q.append("month", String(params.month))
      const qs = q.toString()
      return apiClient.get<any>(`/api/v1/contributions/summary${qs ? `?${qs}` : ""}`)
    },

    deletePayment: (id: string) =>
      apiClient.delete<any>(`/api/v1/contributions/payment/${id}`),
  },

  // ---------------------------------------------------------------------------
  // LOANS
  // ---------------------------------------------------------------------------
  loans: {
    getAll: (status?: string) => {
      const qs = status ? `?status=${encodeURIComponent(status)}` : ""
      return apiClient.get<any[]>(`/api/v1/loans${qs}`)
    },

    getById: (id: string) =>
      apiClient.get<any>(`/api/v1/loans/${id}`),

    create: (data: any) =>
      apiClient.post<any>("/api/v1/loans", data),

    issue: (data: any) =>
      apiClient.post<any>("/api/v1/loans", data),

    update: (id: string, data: any) =>
      apiClient.put<any>(`/api/v1/loans/${id}`, data),

    delete: (id: string) =>
      apiClient.delete<any>(`/api/v1/loans/${id}`),

    repay: (id: string, data: any) =>
      apiClient.post<any>(`/api/v1/loans/${id}/repay`, data),

    deleteRepayment: (id: string) =>
      apiClient.delete<any>(`/api/v1/loans/repayment/${id}`),

    getReports: () =>
      apiClient.get<any>("/api/v1/loans/reports/summary"),
  },

  // ---------------------------------------------------------------------------
  // GRANTS
  // ---------------------------------------------------------------------------
  grants: {
    getAll: () =>
      apiClient.get<any[]>("/api/v1/grants"),

    getById: (id: string) =>
      apiClient.get<any>(`/api/v1/grants/${id}`),

    create: (data: any) =>
      apiClient.post<any>("/api/v1/grants", data),

    issue: (data: any) =>
      apiClient.post<any>("/api/v1/grants", data),

    update: (id: string, data: any) =>
      apiClient.put<any>(`/api/v1/grants/${id}`, data),

    delete: (id: string) =>
      apiClient.delete<any>(`/api/v1/grants/${id}`),
  },

  get qardHasan() {
    return this.loans
  },

  get sadaqah() {
    return this.grants
  },

  // ---------------------------------------------------------------------------
  // LEDGER
  // ---------------------------------------------------------------------------
  ledger: {
    getMemberLedger: (memberId: string) =>
      apiClient.get<any[]>(`/api/v1/ledger/member/${memberId}`),

    getDonorLedger: (donorId: string) =>
      apiClient.get<any[]>(`/api/v1/ledger/donor/${donorId}`),

    getTransactions: (params?: { type?: string; fromDate?: string; toDate?: string }) => {
      const q = new URLSearchParams()
      if (params?.type) q.append("type", params.type)
      if (params?.fromDate) q.append("fromDate", params.fromDate)
      if (params?.toDate) q.append("toDate", params.toDate)
      const qs = q.toString()
      return apiClient.get<any[]>(`/api/v1/ledger/transactions${qs ? `?${qs}` : ""}`)
    },
  },

  // ---------------------------------------------------------------------------
  // DOCUMENTS
  // ---------------------------------------------------------------------------
  documents: {
    getAll: (params?: { categoryId?: string; memberId?: string; beneficiaryId?: string }) => {
      const q = new URLSearchParams()
      if (params?.categoryId) q.append("categoryId", params.categoryId)
      if (params?.memberId) q.append("memberId", params.memberId)
      if (params?.beneficiaryId) q.append("beneficiaryId", params.beneficiaryId)
      const qs = q.toString()
      return apiClient.get<any[]>(`/api/v1/documents${qs ? `?${qs}` : ""}`)
    },

    create: (data: any) =>
      apiClient.post<any>("/api/v1/documents", data),

    delete: (id: string) =>
      apiClient.delete<any>(`/api/v1/documents/${id}`),

    getCategories: () =>
      apiClient.get<any[]>("/api/v1/documents/categories"),

    createCategory: (data: any) =>
      apiClient.post<any>("/api/v1/documents/categories", data),
  },

  // ---------------------------------------------------------------------------
  // REPORTS
  // ---------------------------------------------------------------------------
  reports: {
    getSummary: (params?: { fromDate?: string; toDate?: string }) => {
      const q = new URLSearchParams()
      if (params?.fromDate) q.append("fromDate", params.fromDate)
      if (params?.toDate) q.append("toDate", params.toDate)
      const qs = q.toString()
      return apiClient.get<any>(`/api/v1/reports/summary${qs ? `?${qs}` : ""}`)
    },

    getDetailed: (params?: { fromDate?: string; toDate?: string }) => {
      const q = new URLSearchParams()
      if (params?.fromDate) q.append("fromDate", params.fromDate)
      if (params?.toDate) q.append("toDate", params.toDate)
      const qs = q.toString()
      return apiClient.get<any>(`/api/v1/reports/detailed${qs ? `?${qs}` : ""}`)
    },
  },

  // ---------------------------------------------------------------------------
  // SETTINGS & BRANDING
  // ---------------------------------------------------------------------------
  settings: {
    getBranding: () =>
      apiClient.get<any>("/api/v1/settings/branding", { tags: ["branding"] }),

    getProfile: () =>
      apiClient.get<any>("/api/v1/settings/profile"),

    updateProfile: (data: any) =>
      apiClient.put<any>("/api/v1/settings/profile", data),

    getSystemSettings: () =>
      apiClient.get<Record<string, string>>("/api/v1/settings/system"),

    updateSystemSettings: (data: { settings: Record<string, string>; group?: string }) =>
      apiClient.post<any>("/api/v1/settings/system", data),
  },

  // ---------------------------------------------------------------------------
  // USERS & ROLES
  // ---------------------------------------------------------------------------
  users: {
    getAll: () =>
      apiClient.get<any[]>("/api/v1/users"),

    getById: (id: string) =>
      apiClient.get<any>(`/api/v1/users/${id}`),

    create: (data: any) =>
      apiClient.post<any>("/api/v1/users", data),

    update: (id: string, data: any) =>
      apiClient.put<any>(`/api/v1/users/${id}`, data),

    delete: (id: string) =>
      apiClient.delete<any>(`/api/v1/users/${id}`),

    updatePermissions: (id: string, permissionIds: string[]) =>
      apiClient.put<any>(`/api/v1/users/${id}/permissions`, { permissionIds }),

    changePassword: (id: string, data: any) =>
      apiClient.post<any>(`/api/v1/users/${id}/change-password`, data),
  },

  roles: {
    getAll: () =>
      apiClient.get<any[]>("/api/v1/roles"),

    getById: (id: string) =>
      apiClient.get<any>(`/api/v1/roles/${id}`),

    create: (data: any) =>
      apiClient.post<any>("/api/v1/roles", data),

    update: (id: string, data: any) =>
      apiClient.put<any>(`/api/v1/roles/${id}`, data),

    delete: (id: string) =>
      apiClient.delete<any>(`/api/v1/roles/${id}`),

    getPermissions: () =>
      apiClient.get<any[]>("/api/v1/roles/permissions"),
  },

  // ---------------------------------------------------------------------------
  // AUDIT LOGS
  // ---------------------------------------------------------------------------
  auditLogs: {
    getAll: (params?: { module?: string; action?: string; userId?: string }) => {
      const q = new URLSearchParams()
      if (params?.module) q.append("module", params.module)
      if (params?.action) q.append("action", params.action)
      if (params?.userId) q.append("userId", params.userId)
      const qs = q.toString()
      return apiClient.get<any[]>(`/api/v1/audit-logs${qs ? `?${qs}` : ""}`)
    },

    create: (data: { action: string; module: string; referenceId?: string; remarks?: string }) =>
      apiClient.post<any>("/api/v1/audit-logs", data),
  },

  // ---------------------------------------------------------------------------
  // EXPENSES
  // ---------------------------------------------------------------------------
  expenseNames: {
    getAll: (activeOnly: boolean = false) =>
      apiClient.get<any[]>(`/api/v1/expense-names${activeOnly ? "?active_only=true" : ""}`),

    create: (data: { name: string; expense_name?: string; note?: string }) =>
      apiClient.post<any>("/api/v1/expense-names", data),

    update: (id: string, data: { name?: string; note?: string; isActive?: boolean }) =>
      apiClient.patch<any>(`/api/v1/expense-names/${id}`, data),

    delete: (id: string) =>
      apiClient.delete<any>(`/api/v1/expense-names/${id}`),
  },

  expenses: {
    getAll: (params?: {
      search?: string
      expenseNameId?: string
      groupId?: string
      startDate?: string
      endDate?: string
      page?: number
      pageSize?: number
      sortBy?: string
      sortDesc?: boolean
    }) => {
      const q = new URLSearchParams()
      if (params?.search) q.append("search", params.search)
      if (params?.expenseNameId) q.append("expense_name_id", params.expenseNameId)
      if (params?.groupId) q.append("group_id", params.groupId)
      if (params?.startDate) q.append("start_date", params.startDate)
      if (params?.endDate) q.append("end_date", params.endDate)
      if (params?.page) q.append("page", String(params.page))
      if (params?.pageSize) q.append("page_size", String(params.pageSize))
      if (params?.sortBy) q.append("sort_by", params.sortBy)
      if (params?.sortDesc !== undefined) q.append("sort_desc", String(params.sortDesc))
      const qs = q.toString()
      return apiClient.get<any>(`/api/v1/expenses${qs ? `?${qs}` : ""}`)
    },

    getById: (id: string) =>
      apiClient.get<any>(`/api/v1/expenses/${id}`),

    create: (data: {
      groupId: string
      expenseNameId?: string | null
      customName?: string | null
      amount: number
      comment?: string | null
      expenseDate: string
    }) =>
      apiClient.post<any>("/api/v1/expenses", data),

    update: (id: string, data: {
      groupId?: string
      expenseNameId?: string | null
      customName?: string | null
      amount?: number
      comment?: string | null
      expenseDate?: string
    }) =>
      apiClient.patch<any>(`/api/v1/expenses/${id}`, data),

    delete: (id: string) =>
      apiClient.delete<any>(`/api/v1/expenses/${id}`),

    getReport: (params?: {
      startDate?: string
      endDate?: string
      fromDate?: string
      toDate?: string
      expenseNameId?: string
      groupId?: string
    }) => {
      const q = new URLSearchParams()
      const sDate = params?.fromDate || params?.startDate
      const eDate = params?.toDate || params?.endDate
      if (sDate) {
        q.append("start_date", sDate)
        q.append("from_date", sDate)
      }
      if (eDate) {
        q.append("end_date", eDate)
        q.append("to_date", eDate)
      }
      if (params?.expenseNameId) q.append("expense_name_id", params.expenseNameId)
      if (params?.groupId) q.append("group_id", params.groupId)
      const qs = q.toString()
      return apiClient.get<any>(`/api/v1/expenses/report${qs ? `?${qs}` : ""}`)
    },

    getLedger: (params?: {
      startDate?: string
      endDate?: string
      expenseNameId?: string
      groupId?: string
      search?: string
      page?: number
      pageSize?: number
    }) => {
      const q = new URLSearchParams()
      if (params?.startDate) q.append("start_date", params.startDate)
      if (params?.endDate) q.append("end_date", params.endDate)
      if (params?.expenseNameId) q.append("expense_name_id", params.expenseNameId)
      if (params?.groupId) q.append("group_id", params.groupId)
      if (params?.search) q.append("search", params.search)
      if (params?.page) q.append("page", String(params.page))
      if (params?.pageSize) q.append("page_size", String(params.pageSize))
      const qs = q.toString()
      return apiClient.get<any>(`/api/v1/expenses/ledger${qs ? `?${qs}` : ""}`)
    },
  },
}
