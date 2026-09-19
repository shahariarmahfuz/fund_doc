"use client"

import { useBranding } from "@/components/providers/branding-provider"

export function HeroTitle({ initialName }: { initialName?: string }) {
  const branding = useBranding()
  const name = (branding?.foundationName || initialName || "").trim()

  if (!name) {
    return (
      <div className="space-y-1 py-1">
        <div className="h-10 w-44 bg-slate-200/60 rounded-lg animate-pulse" />
        <div className="h-10 w-52 bg-slate-200/60 rounded-lg animate-pulse" />
      </div>
    )
  }

  const parts = name.split(/\s+/)
  const firstPart = parts.length > 1 ? parts.slice(0, -1).join(" ") : parts[0]
  const secondPart = parts.length > 1 ? parts[parts.length - 1] : ""

  return (
    <div className="space-y-0.5">
      <h1 className="text-[36px] sm:text-5xl font-medium text-[#0F172A] tracking-tight leading-[1.08]">
        {firstPart}
      </h1>
      {secondPart && (
        <h1 className="text-[36px] sm:text-5xl font-medium text-[#0D7E73] tracking-tight leading-[1.08]">
          {secondPart}
        </h1>
      )}
    </div>
  )
}
