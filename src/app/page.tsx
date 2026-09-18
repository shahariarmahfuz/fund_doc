import Link from "next/link"
import Image from "next/image"
import { PublicHeader } from "@/components/public-header"
import { PublicFooter } from "@/components/public-footer"
import { getAuthSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import {
  Users,
  Heart,
  Leaf,
  Star,
  UserPlus,
  FileCheck2,
  ArrowRight,
} from "lucide-react"

export default async function PublicHomepage() {
  const session = await getAuthSession()
  const user = session?.user as any
  if (user?.id) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-dvh w-full bg-gradient-to-b from-[#EFF8F6] via-[#F4F9F7] to-[#F8FCFA] text-[#0F172A] font-sans relative overflow-x-hidden flex flex-col justify-between">
      {/* Fixed Public Header */}
      <PublicHeader />

      {/* =================================================================== */}
      {/* FULL-BLEED ATMOSPHERIC HERO BACKGROUND LAYER (NO HARD BOUNDARIES)   */}
      {/* =================================================================== */}
      <div className="absolute top-0 right-0 w-full h-[560px] sm:h-[620px] pointer-events-none select-none z-0 overflow-hidden">
        <div className="relative w-full h-full">
          <Image
            src="/images/hero-mosque.jpg"
            alt="Humanitarian Atmosphere"
            fill
            priority
            className="object-cover object-[84%_top] sm:object-[74%_top] opacity-85 sm:opacity-90"
            sizes="100vw"
          />
          {/* Seamless Multi-Directional Atmospheric Gradients for High Text Legibility */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#EFF8F6] via-[#EFF8F6]/85 sm:via-[#EFF8F6]/75 via-42% sm:via-45% to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#EFF8F6] via-[#EFF8F6]/40 via-15% to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#EFF8F6]/60 via-transparent to-transparent" />
        </div>
      </div>

      {/* Main Content Area */}
      <main className="w-full max-w-lg sm:max-w-xl md:max-w-2xl mx-auto px-4 sm:px-6 pt-20 sm:pt-24 pb-8 space-y-4 sm:space-y-5 flex-1 relative z-10">
        
        {/* =================================================================== */}
        {/* HERO SECTION (FOREGROUND CONTENT & HORIZONTAL CTA CARDS)            */}
        {/* =================================================================== */}
        <section className="pt-2 sm:pt-4 pb-1 space-y-4 sm:space-y-5">
          {/* Hero Foreground Text */}
          <div className="space-y-3 sm:space-y-3.5 max-w-[310px] sm:max-w-md">
            {/* Pill Category Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E0F4EE]/95 backdrop-blur-xs border border-[#BDE5DC] text-[#0D7E73] text-[11px] sm:text-xs font-semibold shadow-2xs">
              <Leaf className="w-3.5 h-3.5 text-[#0D7E73] shrink-0" />
              <span>Together for a Better Tomorrow</span>
            </div>

            {/* Main Brotherhood Foundation Title */}
            <div className="space-y-0.5">
              <h1 className="text-[36px] sm:text-5xl font-black text-[#0F172A] tracking-tight leading-[1.08]">
                Brotherhood
              </h1>
              <h1 className="text-[36px] sm:text-5xl font-black text-[#0D7E73] tracking-tight leading-[1.08]">
                Foundation
              </h1>
            </div>

            {/* Humanitarian Mission Statement */}
            <p className="text-slate-600 font-medium text-xs sm:text-[14px] leading-relaxed">
              In the service of humanity,
              <br />
              for the pleasure of the Almighty.
            </p>

            {/* Subtle Brand Ribbon: — People • Community • Change */}
            <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-500 pt-0.5">
              <span className="h-[2px] w-6 bg-[#0D7E73] rounded-full" aria-hidden="true" />
              <span>People</span>
              <span className="text-[#0D7E73]">•</span>
              <span>Community</span>
              <span className="text-[#0D7E73]">•</span>
              <span>Change</span>
            </div>
          </div>

          {/* TWO HORIZONTAL CTA CARDS (BECOME A MEMBER + CHECK APPLICATION STATUS) */}
          <div className="space-y-2.5 sm:space-y-3 pt-1">
            {/* Primary Action: Become a Member */}
            <Link
              href="/member-request"
              className="w-full rounded-2xl sm:rounded-3xl bg-gradient-to-r from-[#0C7368] to-[#0A645B] hover:from-[#0B685E] hover:to-[#09574F] text-white p-3.5 sm:p-4.5 flex items-center justify-between shadow-[0_10px_25px_-5px_rgba(12,115,104,0.38)] transition-all duration-150 active:scale-[0.99] group cursor-pointer relative overflow-hidden"
            >
              {/* Subtle background wave/leaf watermark */}
              <div className="absolute right-12 -bottom-6 w-28 h-28 pointer-events-none select-none opacity-10">
                <svg viewBox="0 0 100 100" fill="white">
                  <circle cx="50" cy="50" r="45" stroke="white" strokeWidth="2" fill="none" />
                  <path d="M 50 5 Q 75 50 50 95 Q 25 50 50 5 Z" fill="white" />
                </svg>
              </div>

              {/* Left: Icon + Text Beside It (Strictly Horizontal Composition) */}
              <div className="flex items-center gap-3 sm:gap-4 relative z-10 text-left min-w-0 pr-2">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center shrink-0 shadow-inner">
                  <UserPlus className="w-5 h-5 sm:w-5.5 sm:h-5.5 text-white" strokeWidth={2.2} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-white text-sm sm:text-base tracking-tight leading-tight">
                    Become a Member
                  </h3>
                  <p className="text-white/80 text-[11px] sm:text-xs font-normal mt-0.5">
                    Join hands for a better tomorrow
                  </p>
                </div>
              </div>

              {/* Right: Circular Arrow Button */}
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white text-[#0C7368] flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 group-hover:translate-x-0.5 transition-transform relative z-10">
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-[#0C7368]" strokeWidth={2.2} />
              </div>
            </Link>

            {/* Secondary Action: Check Application Status */}
            <Link
              href="/member-request/status"
              className="w-full rounded-2xl sm:rounded-3xl bg-white/95 hover:bg-white active:bg-slate-50 text-[#0F172A] p-3.5 sm:p-4.5 border border-slate-200/85 flex items-center justify-between shadow-[0_4px_20px_rgba(0,0,0,0.03)] transition-all duration-150 active:scale-[0.99] group cursor-pointer relative overflow-hidden"
            >
              {/* Subtle bottom-right leaf watermark */}
              <div className="absolute -right-2 -bottom-2 w-16 h-16 pointer-events-none select-none opacity-20 text-[#74B6A3]">
                <svg viewBox="0 0 50 50" fill="currentColor">
                  <path d="M 10 50 C 15 30 35 15 50 10 C 50 25 35 45 10 50 Z" />
                </svg>
              </div>

              {/* Left: Icon + Text Beside It (Strictly Horizontal Composition) */}
              <div className="flex items-center gap-3 sm:gap-4 relative z-10 text-left min-w-0 pr-2">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-[#E8F5F1] text-[#0D7E73] flex items-center justify-center shrink-0">
                  <svg
                    className="w-5 h-5 sm:w-5.5 sm:h-5.5 text-[#0D7E73]"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="9" y1="12" x2="13" y2="12" />
                    <polyline points="9 16 11 18 15 14" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-[#0F172A] text-sm sm:text-base tracking-tight leading-tight">
                    Check Application Status
                  </h3>
                  <p className="text-slate-500 text-[11px] sm:text-xs font-normal mt-0.5">
                    Track your application easily
                  </p>
                </div>
              </div>

              {/* Right: Circular Arrow Button */}
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-50 border border-slate-100 text-[#0D7E73] flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 group-hover:translate-x-0.5 transition-transform relative z-10">
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-[#0D7E73]" strokeWidth={2.2} />
              </div>
            </Link>
          </div>
        </section>

        {/* =================================================================== */}
        {/* STATS SECTION (UNIFIED COHESIVE CARD MATCHING REDESIGNED REFERENCE) */}
        {/* =================================================================== */}
        <section className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden">
          {/* Subtle Botanical Leaf Watermarks on Edges */}
          <div className="absolute -left-3 -bottom-3 w-16 h-16 pointer-events-none select-none text-[#74B6A3]/25">
            <svg viewBox="0 0 60 60" fill="currentColor">
              <path d="M 0 60 C 15 40 35 30 55 25 C 45 45 30 55 0 60 Z" />
            </svg>
          </div>
          <div className="absolute -right-3 -bottom-3 w-16 h-16 pointer-events-none select-none text-[#74B6A3]/25">
            <svg viewBox="0 0 60 60" fill="currentColor">
              <path d="M 60 60 C 45 40 25 30 5 25 C 15 45 30 55 60 60 Z" />
            </svg>
          </div>

          {/* Top Row: Two Stat Items */}
          <div className="grid grid-cols-2 divide-x divide-slate-100 relative z-10">
            {/* Stat Item 1: Lives Supported */}
            <div className="flex items-center gap-2 sm:gap-3.5 pr-1.5 sm:pr-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#E0F4EE] text-[#0D7E73] flex items-center justify-center shrink-0 shadow-2xs">
                <Users className="w-4.5 h-4.5 sm:w-5.5 sm:h-5.5" />
              </div>
              <div className="text-left min-w-0">
                <div className="text-lg sm:text-2xl font-black text-[#0F172A] tracking-tight leading-none">
                  1,250+
                </div>
                <div className="text-xs sm:text-sm font-bold text-slate-800 leading-tight mt-1">
                  Lives Supported
                </div>
                <div className="text-[10px] sm:text-[11px] text-slate-400 font-normal leading-tight mt-0.5">
                  Real people, real change
                </div>
              </div>
            </div>

            {/* Stat Item 2: Community Projects */}
            <div className="flex items-center gap-2 sm:gap-3.5 pl-2 sm:pl-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#E0F4EE] text-[#0D7E73] flex items-center justify-center shrink-0 shadow-2xs">
                <Heart className="w-4.5 h-4.5 sm:w-5.5 sm:h-5.5 fill-[#0D7E73]" />
              </div>
              <div className="text-left min-w-0">
                <div className="text-lg sm:text-2xl font-black text-[#0F172A] tracking-tight leading-none">
                  50+
                </div>
                <div className="text-xs sm:text-sm font-bold text-slate-800 leading-tight mt-1">
                  Community Projects
                </div>
                <div className="text-[10px] sm:text-[11px] text-slate-400 font-normal leading-tight mt-0.5">
                  Stronger communities every day
                </div>
              </div>
            </div>
          </div>

          {/* Clean Horizontal Divider Line */}
          <div className="my-3.5 sm:my-4.5 border-t border-slate-100 relative z-10" />

          {/* Bottom Row: 100% For a Better Tomorrow */}
          <div className="flex items-center justify-center gap-2.5 sm:gap-3 relative z-10">
            <div className="flex items-center gap-1.5 shrink-0">
              <Leaf className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-[#0D7E73] fill-[#0D7E73]/20" />
              <span className="text-lg sm:text-2xl font-black text-[#0D7E73] tracking-tight">
                100%
              </span>
            </div>
            <div className="text-left">
              <div className="text-xs sm:text-sm font-bold text-slate-800 leading-tight">
                For a Better Tomorrow
              </div>
              <div className="text-[10px] sm:text-[11px] text-slate-400 font-normal leading-tight mt-0.5">
                Together we build a kinder, brighter future
              </div>
            </div>
          </div>
        </section>

        {/* =================================================================== */}
        {/* OUR VALUES SECTION (PREMIUM SOFT MINT CARD MATCHING VISUAL REF)     */}
        {/* =================================================================== */}
        <section className="relative rounded-3xl bg-[#EEF7F4] border border-[#CCEAE0] shadow-[0_4px_24px_rgba(13,126,115,0.04)] px-2 sm:px-6 py-5 sm:py-6 overflow-hidden text-center">
          {/* Left Decorative Botanical Leaves */}
          <svg
            className="absolute -left-1 sm:left-0 top-1.5 sm:top-2 w-14 sm:w-20 h-22 sm:h-28 pointer-events-none select-none text-[#74B6A3]/65"
            viewBox="0 0 100 130"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M -5 115 C 18 85, 34 55, 46 22"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path
              d="M 46 22 C 60 12, 82 16, 88 34 C 74 46, 52 38, 46 22 Z"
              fill="currentColor"
            />
            <path
              d="M 36 42 C 26 28, 8 28, 4 42 C 16 52, 30 50, 36 42 Z"
              fill="currentColor"
            />
            <path
              d="M 26 66 C 42 56, 62 62, 65 76 C 50 84, 34 78, 26 66 Z"
              fill="currentColor"
            />
            <path
              d="M 14 90 C 2 78, -6 82, -8 94 C 2 102, 12 98, 14 90 Z"
              fill="currentColor"
            />
          </svg>

          {/* Right Decorative Botanical Leaves */}
          <svg
            className="absolute -right-1 sm:right-0 top-1.5 sm:top-2 w-14 sm:w-20 h-22 sm:h-28 pointer-events-none select-none text-[#74B6A3]/65"
            viewBox="0 0 100 130"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M 105 115 C 82 85, 66 55, 54 22"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path
              d="M 54 22 C 40 12, 18 16, 12 34 C 26 46, 48 38, 54 22 Z"
              fill="currentColor"
            />
            <path
              d="M 64 42 C 74 28, 92 28, 96 42 C 84 52, 70 50, 64 42 Z"
              fill="currentColor"
            />
            <path
              d="M 74 66 C 58 56, 38 62, 35 76 C 50 84, 66 78, 74 66 Z"
              fill="currentColor"
            />
            <path
              d="M 86 90 C 98 78, 106 82, 108 94 C 98 102, 88 98, 86 90 Z"
              fill="currentColor"
            />
          </svg>

          {/* Center Heading with Decorative Thin Lines */}
          <div className="flex items-center justify-center gap-2.5 sm:gap-3.5 relative z-10">
            <span className="h-[1px] w-6 sm:w-9 bg-[#7BBBAA]" aria-hidden="true" />
            <span className="text-[10px] sm:text-[11px] font-bold tracking-[0.22em] text-[#2F7E6F] uppercase">
              OUR VALUES
            </span>
            <span className="h-[1px] w-6 sm:w-9 bg-[#7BBBAA]" aria-hidden="true" />
          </div>

          {/* Centerpiece Headline: People • Community • Change */}
          <h2 className="font-serif italic text-xl sm:text-2xl md:text-[28px] font-medium text-[#115E54] tracking-tight mt-1.5 relative z-10">
            People <span className="inline-block mx-1 sm:mx-2 text-[#4EA896] not-italic text-sm sm:text-base align-middle">•</span> Community <span className="inline-block mx-1 sm:mx-2 text-[#4EA896] not-italic text-sm sm:text-base align-middle">•</span> Change
          </h2>

          {/* Tagline */}
          <p className="text-xs sm:text-[13px] font-medium text-[#2F7E6F]/90 mt-1 relative z-10">
            Together for a kinder, stronger tomorrow.
          </p>

          {/* 4 Values Grid with Subtle Vertical Dividers */}
          <div className="grid grid-cols-4 divide-x divide-[#CCEAE0] mt-5 sm:mt-6 pt-1 relative z-10">
            {/* Value 1: Compassion */}
            <div className="px-1 sm:px-2 flex flex-col items-center text-center">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#DCF3EB] flex items-center justify-center mb-2 shadow-2xs">
                <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-[#0D7E73] fill-[#0D7E73]" />
              </div>
              <h3 className="font-serif font-bold text-[#0F172A] text-xs sm:text-sm tracking-tight">
                Compassion
              </h3>
              <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium leading-tight mt-0.5">
                We care
              </p>
            </div>

            {/* Value 2: Unity */}
            <div className="px-1 sm:px-2 flex flex-col items-center text-center">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#FEF3C7] flex items-center justify-center mb-2 shadow-2xs">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-[#D97706] fill-[#D97706]" />
              </div>
              <h3 className="font-serif font-bold text-[#0F172A] text-xs sm:text-sm tracking-tight">
                Unity
              </h3>
              <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium leading-tight mt-0.5">
                We stand together
              </p>
            </div>

            {/* Value 3: Service */}
            <div className="px-1 sm:px-2 flex flex-col items-center text-center">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#DCFCE7] flex items-center justify-center mb-2 shadow-2xs">
                <Leaf className="w-4 h-4 sm:w-5 sm:h-5 text-[#16A34A]" />
              </div>
              <h3 className="font-serif font-bold text-[#0F172A] text-xs sm:text-sm tracking-tight">
                Service
              </h3>
              <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium leading-tight mt-0.5">
                We take action
              </p>
            </div>

            {/* Value 4: Impact */}
            <div className="px-1 sm:px-2 flex flex-col items-center text-center">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#E0F2FE] flex items-center justify-center mb-2 shadow-2xs">
                <Star className="w-4 h-4 sm:w-5 sm:h-5 text-[#0284C7] fill-[#0284C7]" />
              </div>
              <h3 className="font-serif font-bold text-[#0F172A] text-xs sm:text-sm tracking-tight">
                Impact
              </h3>
              <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium leading-tight mt-0.5">
                We create change
              </p>
            </div>
          </div>
        </section>

        {/* =================================================================== */}
        {/* MISSION / QUOTE SECTION (WARM CREAM/GOLD TINTED CARD)               */}
        {/* =================================================================== */}
        <section className="rounded-3xl bg-[#FEF7EA] border border-[#FDE68A]/65 shadow-[0_6px_20px_rgba(217,119,6,0.05)] p-5 sm:p-7 text-center relative overflow-hidden">
          {/* Faint Golden Botanical Leaf Watermarks on Edges */}
          <div className="absolute -left-2 -bottom-2 w-16 h-16 pointer-events-none select-none text-[#D97706]/15">
            <svg viewBox="0 0 60 60" fill="currentColor">
              <path d="M 0 60 C 15 40 35 30 55 25 C 45 45 30 55 0 60 Z" />
            </svg>
          </div>
          <div className="absolute -right-2 -bottom-2 w-16 h-16 pointer-events-none select-none text-[#D97706]/15">
            <svg viewBox="0 0 60 60" fill="currentColor">
              <path d="M 60 60 C 45 40 25 30 5 25 C 15 45 30 55 60 60 Z" />
            </svg>
          </div>

          {/* Subtle Decorative Golden Quote Mark */}
          <div className="text-[#D97706] text-3xl sm:text-4xl font-serif font-black leading-none mb-1 select-none relative z-10">
            “
          </div>
          
          <blockquote className="text-sm sm:text-base font-bold text-[#92400E] leading-snug tracking-tight max-w-sm sm:max-w-md mx-auto relative z-10">
            "In the service of humanity,
            <br />
            for the pleasure of the Almighty"
          </blockquote>

          <cite className="text-[11px] sm:text-xs font-semibold text-[#B45309]/85 mt-2 sm:mt-2.5 block tracking-normal not-italic relative z-10">
            — Brotherhood Foundation
          </cite>
        </section>
      </main>

      {/* Reusable Public Footer */}
      <PublicFooter />
    </div>
  )
}
