"use client"

import React, { createContext, useContext } from "react"

export type BrandingType = {
  foundationName: string
  shortName: string
  logo: string | null
  favicon: string | null
  loginLogo: string | null
  sidebarLogo: string | null
  headerLogo: string | null
}

const BrandingContext = createContext<BrandingType | null>(null)

let lastKnownBranding: BrandingType | null = null

export function BrandingProvider({
  branding,
  children
}: {
  branding: BrandingType
  children: React.ReactNode
}) {
  if (branding && branding.foundationName && branding.foundationName !== "Foundation ERP") {
    lastKnownBranding = branding
  }

  const effectiveBranding = (branding && branding.foundationName && branding.foundationName !== "Foundation ERP")
    ? branding
    : (lastKnownBranding || branding)

  return (
    <BrandingContext.Provider value={effectiveBranding}>
      {children}
    </BrandingContext.Provider>
  )
}

export function useBranding() {
  const context = useContext(BrandingContext)
  if (!context) {
    throw new Error("useBranding must be used within a BrandingProvider")
  }
  return context
}
