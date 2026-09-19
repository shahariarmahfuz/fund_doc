import { LoginForm } from "./login-form"
import { getAuthSession } from "@/lib/auth"
import { apiClient } from "@/lib/api/client"
import { redirect } from "next/navigation"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Login | Foundation ERP",
  description: "Login to Foundation ERP system",
}

export default async function LoginPage() {
  const session = await getAuthSession()
  const user = session?.user as any

  if (user?.id) {
    try {
      const me = await apiClient.auth.getMe()
      if (me && (me.id || me.data?.id)) {
        redirect("/dashboard")
      }
    } catch {
      // Backend rejected existing session token (expired, revoked, or DB migration).
      // Do NOT redirect to /dashboard to prevent redirect loops.
      // Instead, proceed to show LoginForm so the user can re-authenticate cleanly.
    }
  }

  return <LoginForm />
}
