import { getSystemSettings } from "@/features/settings/actions"
import { PersonalProfileForm } from "@/features/settings/components/personal-profile-form"
import { FoundationBrandingForm } from "@/features/settings/components/foundation-branding-form"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { getAuthSession } from "@/lib/auth"
import { apiClient } from "@/lib/api/client"
import { redirect } from "next/navigation"

export default async function SettingsProfilePage() {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    redirect("/login")
  }

  let dbUser: any = null
  try {
    dbUser = await apiClient.users.getById(session.user.id)
  } catch (err) {
    console.error("Error fetching user profile:", err)
  }

  if (!dbUser) {
    redirect("/login")
  }

  const systemSettings = await getSystemSettings()

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/settings">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profile & Branding</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your personal profile and the foundation's visual identity.
          </p>
        </div>
      </div>

      <Tabs defaultValue="personal" className="space-y-4">
        <TabsList>
          <TabsTrigger value="personal">Personal Profile</TabsTrigger>
          <TabsTrigger value="branding">Foundation Branding</TabsTrigger>
        </TabsList>
        <TabsContent value="personal">
          <PersonalProfileForm 
            user={{
              id: dbUser.id,
              name: dbUser.name,
              email: dbUser.email || "",
              mobile: dbUser.mobile || "",
              photo: dbUser.photo || "",
            }} 
          />
        </TabsContent>
        <TabsContent value="branding">
          <FoundationBrandingForm initialSettings={systemSettings} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
