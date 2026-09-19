"use client"

import { useBranding } from "@/components/providers/branding-provider"

export function HeroQuoteAuthor({ initialName }: { initialName?: string }) {
  const branding = useBranding()
  const name = branding?.foundationName || initialName || "Foundation"

  return (
    <cite className="text-[11px] sm:text-xs font-medium text-[#B45309]/85 mt-2 sm:mt-2.5 block tracking-normal not-italic relative z-10">
      — {name}
    </cite>
  )
}
