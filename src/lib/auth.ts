import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { getServerSession } from "next-auth/next"
import { cache } from "react"
import { apiClient } from "./api/client"

export const getAuthSession = cache(async () => {
  try {
    return await getServerSession(authOptions)
  } catch (e) {
    return null
  }
})

function parseUserAgent(ua: string) {
  let browser = "Unknown Browser"
  let os = "Unknown OS"
  let device = "Desktop"

  if (ua.includes("Firefox")) browser = "Firefox"
  else if (ua.includes("SamsungBrowser")) browser = "Samsung Internet"
  else if (ua.includes("Opera") || ua.includes("OPR")) browser = "Opera"
  else if (ua.includes("Edge") || ua.includes("Edg")) browser = "Edge"
  else if (ua.includes("Chrome")) browser = "Chrome"
  else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari"

  if (ua.includes("Windows")) os = "Windows"
  else if (ua.includes("Mac OS")) os = "MacOS"
  else if (ua.includes("Linux") && !ua.includes("Android")) os = "Linux"
  else if (ua.includes("Android")) os = "Android"
  else if (ua.includes("iOS") || ua.includes("iPhone") || ua.includes("iPad")) os = "iOS"

  if (ua.includes("Mobile") || ua.includes("Android") || ua.includes("iPhone")) {
    device = "Mobile"
  } else if (ua.includes("iPad") || ua.includes("Tablet")) {
    device = "Tablet"
  }

  return { browser, os, device }
}

const useSecure =
  process.env.NEXTAUTH_URL?.startsWith("https://") ||
  process.env.NODE_ENV === "production" ||
  Boolean(process.env.VERCEL)

export const authOptions: NextAuthOptions = {
  // @ts-ignore
  trustHost: true,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days max global
  },
  cookies: {
    sessionToken: {
      name: useSecure ? `__Secure-next-auth.session-token` : `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecure,
      },
    },
    callbackUrl: {
      name: useSecure ? `__Secure-next-auth.callback-url` : `next-auth.callback-url`,
      options: {
        sameSite: "lax",
        path: "/",
        secure: useSecure,
      },
    },
    csrfToken: {
      name: useSecure ? `__Host-next-auth.csrf-token` : `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecure,
      },
    },
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
        rememberMe: { label: "Remember Me", type: "text" },
      },
      async authorize(credentials, req) {
        if (!credentials?.username || !credentials?.password) {
          throw new Error("Invalid username or email.")
        }

        const headers = req?.headers as any
        let userAgent = "Unknown"
        if (headers) {
          userAgent = headers["user-agent"] || (typeof headers.get === "function" ? headers.get("user-agent") : "Unknown") || "Unknown"
        }

        const { browser, os, device } = parseUserAgent(userAgent)

        console.log(`[AUTH_LOGIN_STARTED] Login attempt for username=${credentials.username}`)

        try {
          const authData = await apiClient.auth.login({
            username: credentials.username,
            password: credentials.password,
            rememberMe: credentials.rememberMe === "true",
            device,
            browser,
            os,
          })

          if (!authData || !authData.access_token) {
            console.warn("[AUTH_LOGIN_FAILED] No access token in response")
            throw new Error("Login failed.")
          }

          const user = authData.user
          const expiresAtMs = authData.expires_at ? authData.expires_at * 1000 : Date.now() + 30 * 24 * 60 * 60 * 1000

          console.log(`[AUTH_LOGIN_SUCCESS] User ${user.username} authenticated successfully`)
          console.log(`[AUTH_SESSION_CREATED] Session created for user_id=${user.id} role=${user.role}`)

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            image: user.photo,
            accessToken: authData.access_token,
            refreshToken: authData.refresh_token,
            permissions: user.permissions || [],
            expiresAt: expiresAtMs,
          } as any
        } catch (err: any) {
          const msg = err?.message || "Invalid username or password."
          console.warn(`[AUTH_LOGIN_FAILED] Login error: ${msg}`)
          throw new Error(msg)
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (trigger === "update" && session) {
        if (session.image !== undefined) token.picture = session.image
        if (session.name !== undefined) token.name = session.name
      }
      if (user) {
        token.id = user.id
        token.name = user.name
        token.role = (user as any).role
        token.picture = (user as any).image || (user as any).photo
        token.accessToken = (user as any).accessToken
        token.refreshToken = (user as any).refreshToken
        token.permissions = (user as any).permissions
        token.expiresAt = (user as any).expiresAt || (Date.now() + 30 * 24 * 60 * 60 * 1000)
        return token
      }

      if (!token?.id) {
        console.log("[AUTH_SESSION_MISSING] No token id in jwt callback")
        return {} as any
      }

      console.log(`[AUTH_SESSION_CHECK] Session valid for user=${token.id} role=${token.role}`)

      // Check dynamic expiration - proactively refresh within 5 minutes of expiration
      const expiresAt = (token.expiresAt as number) || (Date.now() + 30 * 24 * 60 * 60 * 1000)
      const now = Date.now()

      // If token still valid for more than 5 minutes, keep using it
      if (now < expiresAt - 5 * 60 * 1000) {
        return token
      }

      // Proactively refresh the token via backend
      console.log(`[AUTH_REFRESH_STARTED] Refreshing token for user=${token.id}`)
      try {
        const refreshRes = await apiClient.auth.refresh({
          refreshToken: (token.refreshToken as string) || (token.accessToken as string)
        })
        if (refreshRes && refreshRes.access_token) {
          console.log(`[AUTH_REFRESH_SUCCESS] Refreshed token for user=${token.id}`)
          token.accessToken = refreshRes.access_token
          if (refreshRes.refresh_token) token.refreshToken = refreshRes.refresh_token
          token.expiresAt = refreshRes.expires_at ? refreshRes.expires_at * 1000 : Date.now() + 30 * 24 * 60 * 60 * 1000
          token.error = undefined
          return token
        }
      } catch (err: any) {
        console.warn(`[AUTH_REFRESH_FAILED] Proactive token refresh failed for user=${token.id}:`, err?.message || err)
        // Non-destructive: Preserve existing session during transient network/server downtime
        if (now >= expiresAt + 24 * 60 * 60 * 1000) {
          console.warn(`[AUTH_SESSION_CLEARED] reason=hard_expiration_reached user=${token.id}`)
          return {} as any
        }
        return token
      }

      return token
    },
    async session({ session, token }) {
      if (!token || !token.id) {
        console.log("[AUTH_SESSION_MISSING] No user token in session callback")
        return {
          ...session,
          user: undefined,
        } as any
      }
      console.log(`[AUTH_SESSION_PRESENT] Session verified for user=${token.id} role=${token.role}`)
      session.user = {
        ...(session.user || {}),
        id: token.id as string,
        name: token.name as string | null | undefined,
        email: token.email as string | null | undefined,
        role: token.role as string,
        image: token.picture as string | null | undefined,
      } as any
      ;(session as any).accessToken = token.accessToken
      ;(session as any).refreshToken = token.refreshToken
      ;(session as any).permissions = token.permissions || []
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}
