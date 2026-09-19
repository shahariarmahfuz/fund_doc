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
    redirect("/dashboard")
  }

  return <LoginForm />
}
