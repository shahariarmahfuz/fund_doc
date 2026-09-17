import { PreferencesForm } from "@/features/settings/components/preferences-form"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { getAuthSession } from "@/lib/auth"
import { apiClient } from "@/lib/api/client"

export default async function PreferencesPage() {
  const session = await getAuthSession()
  let userPrefs = {}

  if (session?.user?.id) {
    try {
      const user = await apiClient.users.getById(session.user.id)
      if (user?.preferences) {
        userPrefs = typeof user.preferences === "string" ? JSON.parse(user.preferences) : user.preferences
      }
    } catch (e) {
      // ignore
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/settings">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Preferences</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Personalize your interface and behavior.
          </p>
        </div>
      </div>

      <PreferencesForm initialData={userPrefs} userId={session?.user?.id || ""} />
    </div>
  )
}
