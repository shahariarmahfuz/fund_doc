import NextAuth, { DefaultSession, DefaultUser } from "next-auth"
import { JWT } from "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role?: string
    } & DefaultSession["user"]
    accessToken?: string
    permissions?: string[]
    jti?: string
  }

  interface User extends DefaultUser {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
    role?: string
    accessToken?: string
    permissions?: string[]
    jti?: string
    expiresAt?: number
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string
    name?: string | null
    email?: string | null
    role?: string
    picture?: string | null
    accessToken?: string
    permissions?: string[]
    sessionId?: string
    jti?: string
    expiresAt?: number
  }
}
