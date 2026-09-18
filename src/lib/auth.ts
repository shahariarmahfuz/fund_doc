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

const useSecure = process.env.NEXTAUTH_URL?.startsWith("https://") ?? false

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
            throw new Error("Login failed.")
          }

          const user = authData.user

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            image: user.photo,
            accessToken: authData.access_token,
            permissions: user.permissions || [],
            expiresAt: authData.expires_at ? authData.expires_at * 1000 : Date.now() + 24 * 60 * 60 * 1000,
          } as any
        } catch (err: any) {
          const msg = err?.message || "Invalid username or password."
          throw new Error(msg)
        }
      },
    }),
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return url
      try {
        if (new URL(url).origin === baseUrl) return url
      } catch (e) {}
      return baseUrl
    },
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
        token.permissions = (user as any).permissions
        token.expiresAt = (user as any).expiresAt
      }

      // Check dynamic expiration
      if (token.expiresAt && Date.now() > (token.expiresAt as number)) {
        return {} as any
      }

      return token
    },
    async session({ session, token }) {
      if (!token || !token.id) {
        return session
      }
      session.user = {
        ...(session.user || {}),
        id: token.id as string,
        name: token.name as string | null | undefined,
        email: token.email as string | null | undefined,
        role: token.role as string,
        image: token.picture as string | null | undefined,
      } as any
      ;(session as any).accessToken = token.accessToken
      ;(session as any).permissions = token.permissions || []
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}
