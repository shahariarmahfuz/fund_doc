import type { Metadata } from "next"
import Script from "next/script"
import { Inter } from "next/font/google"
import "./globals.css"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { SidebarProvider } from "@/components/layout/sidebar-provider"

import { getAuthSession } from "@/lib/auth"

import { AuthProvider } from "@/components/auth-provider"
import { RbacProvider } from "@/components/providers/rbac-provider"
import { getUserPermissions, getUserPreferences } from "@/lib/rbac"
import { Toaster } from "sonner"

const inter = Inter({
  subsets: ["latin"],
})

import { getBrandingSettings } from "@/lib/branding"

export async function generateMetadata(): Promise<Metadata> {
  const branding = await getBrandingSettings()
  
  let icons: any = undefined
  if (branding.favicon) {
    const v = Date.now();
    const isCloudinary = branding.favicon.includes('res.cloudinary.com');
    
    if (isCloudinary) {
      const parts = branding.favicon.split('/upload/');
      if (parts.length === 2) {
        icons = {
          icon: [16, 32, 48, 192, 512].map(size => ({
            url: `${parts[0]}/upload/w_${size},h_${size},c_scale/${parts[1]}?v=${v}`,
            sizes: `${size}x${size}`,
            type: 'image/png'
          })),
          apple: [
            { url: `${parts[0]}/upload/w_180,h_180,c_scale/${parts[1]}?v=${v}`, sizes: '180x180', type: 'image/png' }
          ]
        };
      }
    }
    
    if (!icons) {
      icons = { icon: `${branding.favicon}?v=${v}` };
    }
  }

  return {
    title: branding.foundationName || "Foundation ERP",
    description: "Foundation Management System",
    icons,
  }
}

import { BrandingProvider } from "@/components/providers/branding-provider"


export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getAuthSession()
  const user = session?.user as any
  const isLoggedIn = !!user?.id
  const permissions = isLoggedIn ? await getUserPermissions(user.id) : []
  const branding = await getBrandingSettings()

  let userDateFormat = branding.dateFormat || 'dd MMM yyyy';
  const userTimezone = branding.timezone || 'Asia/Dhaka';

  if (isLoggedIn && user?.id) {
    const userPrefs = await getUserPreferences(user.id);
    if (userPrefs?.dateFormat) userDateFormat = userPrefs.dateFormat;
  }

  if (typeof globalThis !== 'undefined') {
    // eslint-disable-next-line
    (globalThis as any).APP_TIMEZONE = userTimezone;
    // eslint-disable-next-line
    (globalThis as any).APP_DATE_FORMAT = userDateFormat;
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link href="https://cdn.jsdelivr.net/npm/@fontsource/jetbrains-mono@5.0.6/index.min.css" rel="stylesheet" />
      </head>
      <body className={`${inter.className} h-dvh w-full overflow-hidden flex`} suppressHydrationWarning>
        <Script
          id="app-settings"
          dangerouslySetInnerHTML={{
            __html: `window.APP_TIMEZONE = "${userTimezone}"; window.APP_DATE_FORMAT = "${userDateFormat}";`
          }}
        />
        <BrandingProvider branding={branding}>
          <AuthProvider>
            <RbacProvider permissions={permissions}>
              <SidebarProvider>
                {isLoggedIn && <Sidebar />}
                <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                  {isLoggedIn && <Header />}
                  <main className={`flex-1 overflow-auto ${isLoggedIn ? "p-4 sm:p-6 bg-muted/20" : ""}`}>
                    {children}
                  </main>
                </div>
              </SidebarProvider>
              <Toaster />
            </RbacProvider>
          </AuthProvider>
        </BrandingProvider>
      </body>
    </html>
  )
}
