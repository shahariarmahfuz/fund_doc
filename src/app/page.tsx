import Link from "next/link"
import Image from "next/image"
import { PublicHeader } from "@/components/public-header"
import { PublicFooter } from "@/components/public-footer"
import { HeroTitle } from "@/components/home/hero-title"
import { HeroQuoteAuthor } from "@/components/home/hero-quote-author"
import { getAuthSession } from "@/lib/auth"
import { apiClient } from "@/lib/api/client"
import { getBrandingSettings } from "@/lib/branding"
import { googleSansFlex } from "@/lib/fonts"
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
  const [session, branding] = await Promise.all([
    getAuthSession(),
    getBrandingSettings(),
  ])

  const user = session?.user as any
  if (user?.id) {
    try {
      const me = await apiClient.auth.getMe()
      if (me && (me.id || me.data?.id)) {
        redirect("/dashboard")
      }
    } catch {
      // Session invalid on backend, stay on public homepage
    }
  }

  return (
    <div className={`${googleSansFlex.className} font-sans min-h-dvh w-full bg-gradient-to-b from-[#EFF8F6] via-[#F4F9F7] to-[#F8FCFA] text-[#0F172A] relative overflow-x-hidden flex flex-col justify-between`}>
      {/* Fixed Public Header */}
      <PublicHeader />

      {/* =================================================================== */}
      {/* FULL-BLEED ATMOSPHERIC HERO BACKGROUND LAYER (NO HARD BOUNDARIES)   */}
      {/* =================================================================== */}
      <div className="absolute top-0 right-0 w-full md:w-[70%] lg:w-[64%] xl:w-[60%] h-[600px] sm:h-[640px] md:h-[680px] pointer-events-none select-none z-0 overflow-hidden">
        <div className="relative w-full h-full">
          <div className="absolute inset-0 w-[128%] sm:w-[115%] md:w-full h-full -right-[12%] sm:-right-[6%] md:right-0">
            <Image
              src="/images/hero-mosque.jpg"
              alt={branding.foundationName || "Humanitarian Atmosphere"}
              fill
              priority
              className="object-cover object-[center_0%] sm:object-[center_16%] md:object-[center_38%] opacity-85 sm:opacity-90"
              sizes="(max-width: 768px) 128vw, 70vw"
            />
          </div>
          {/* Seamless Multi-Directional Atmospheric Gradients for High Text Legibility */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#EFF8F6] via-[#EFF8F6]/85 md:via-[#EFF8F6]/60 via-42% md:via-25% to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#EFF8F6] via-[#EFF8F6]/40 via-15% to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#EFF8F6]/50 via-transparent to-transparent" />
        </div>
      </div>

      {/* Main Content Area */}
      <main className="w-full max-w-lg sm:max-w-xl md:max-w-5xl lg:max-w-6xl mx-auto px-4 sm:px-6 md:px-8 pt-20 sm:pt-24 pb-12 space-y-4 sm:space-y-6 flex-1 relative z-10">
        
        {/* =================================================================== */}
        {/* HERO SECTION (FOREGROUND CONTENT & HORIZONTAL CTA CARDS)            */}
        {/* =================================================================== */}
        <section className="pt-2 sm:pt-4 pb-1 space-y-4 sm:space-y-6 relative">
          {/* Desktop Floating Script Accent */}
          <div className="hidden md:block absolute right-8 lg:right-24 top-2 lg:top-6 select-none pointer-events-none text-right -rotate-6 tracking-wide leading-tight">
            <span className="italic font-light text-2xl lg:text-[34px] text-[#2F6558]/80 block drop-shadow-2xs">
              A kinder
            </span>
            <span className="italic font-light text-2xl lg:text-[34px] text-[#2F6558]/80 block drop-shadow-2xs">
              Stronger
            </span>
            <span className="italic font-light text-2xl lg:text-[34px] text-[#2F6558]/80 block drop-shadow-2xs">
              Tomorrow
            </span>
            <svg className="w-24 h-4 text-[#2F6558]/70 ml-auto mt-0.5" viewBox="0 0 100 20" fill="none">
              <path d="M 10 10 Q 50 18 95 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>

          {/* Hero Foreground Text */}
          <div className="space-y-3 sm:space-y-3.5 max-w-[310px] sm:max-w-md">
            {/* Pill Category Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E0F4EE]/95 backdrop-blur-xs border border-[#BDE5DC] text-[#0D7E73] text-[11px] sm:text-xs font-medium shadow-2xs">
              <Leaf className="w-3.5 h-3.5 text-[#0D7E73] shrink-0" />
              <span>Together for a Better Tomorrow</span>
            </div>

            {/* Dynamic Foundation Title */}
            <HeroTitle initialName={branding.foundationName} />

            {/* Humanitarian Mission Statement */}
            <p className="text-slate-600 font-normal text-xs sm:text-[14px] leading-relaxed">
              In the service of humanity,
              <br />
              for the pleasure of the Almighty.
            </p>

            {/* Tag Line: Mobile has "— People • Community • Change", Desktop has icons with dividers */}
            <div className="pt-0.5">
              {/* Mobile version */}
              <div className="flex sm:hidden items-center gap-2 text-xs font-medium text-[#0D7E73]">
                <span className="w-4 h-[2px] bg-[#0D7E73] rounded-full" />
                <span>People</span>
                <span className="text-[#0D7E73]">•</span>
                <span>Community</span>
                <span className="text-[#0D7E73]">•</span>
                <span>Change</span>
              </div>
              {/* Desktop / Tablet version */}
              <div className="hidden sm:flex items-center gap-2.5 sm:gap-3 text-xs sm:text-sm font-medium text-[#0D7E73]">
                <span className="flex items-center gap-1.5">
                  <Leaf className="w-3.5 h-3.5 text-[#0D7E73]" /> People
                </span>
                <span className="text-slate-300">|</span>
                <span className="flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 fill-[#0D7E73] text-[#0D7E73]" /> Community
                </span>
                <span className="text-slate-300">|</span>
                <span className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#0D7E73]" /> Change
                </span>
              </div>
            </div>
          </div>

          {/* TWO HORIZONTAL CTA CARDS (1 COL ON MOBILE, 2 COLS ON DESKTOP) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 lg:gap-5 pt-1">
            {/* Primary Action: Become a Member */}
            <Link
              href="/member-request"
              className="w-full rounded-2xl sm:rounded-3xl bg-gradient-to-r from-[#0C7368] to-[#0A645B] hover:from-[#0B685E] hover:to-[#09574F] text-white p-4 sm:p-5 flex items-center justify-between shadow-[0_10px_25px_-5px_rgba(12,115,104,0.38)] transition-all duration-150 active:scale-[0.99] group cursor-pointer relative overflow-hidden"
            >
              {/* Subtle background wave/leaf watermark */}
              <div className="absolute right-12 -bottom-6 w-32 h-32 pointer-events-none select-none opacity-15">
                <svg viewBox="0 0 100 100" fill="none" stroke="white" strokeWidth="3">
                  <path d="M 20 80 C 40 40 70 30 90 20" />
                  <path d="M 40 90 C 60 50 85 40 100 35" />
                  <path d="M 60 95 C 75 70 90 60 100 55" />
                </svg>
              </div>

              {/* Left: Icon + Text Beside It (Strictly Horizontal Composition) */}
              <div className="flex items-center gap-3.5 sm:gap-4 relative z-10 text-left min-w-0 pr-2">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center shrink-0 shadow-inner">
                  <UserPlus className="w-5 h-5 sm:w-5.5 sm:h-5.5 text-white" strokeWidth={2.2} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-medium text-white text-sm sm:text-base tracking-tight leading-tight">
                    Become a Member
                  </h3>
                  <p className="text-white/80 text-[11px] sm:text-xs font-normal mt-0.5">
                    Join hands for a better tomorrow
                  </p>
                </div>
              </div>

              {/* Right: Divider & Circular Arrow Button */}
              <div className="flex items-center gap-3 sm:gap-4 shrink-0 relative z-10">
                <span className="h-7 w-px bg-white/20" aria-hidden="true" />
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white text-[#0C7368] flex items-center justify-center shadow-xs group-hover:scale-105 group-hover:translate-x-0.5 transition-transform">
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-[#0C7368]" strokeWidth={2.2} />
                </div>
              </div>
            </Link>

            {/* Secondary Action: Check Application Status */}
            <Link
              href="/member-request/status"
              className="w-full rounded-2xl sm:rounded-3xl bg-white/95 hover:bg-white active:bg-slate-50 text-[#0F172A] p-4 sm:p-5 border border-slate-200/85 flex items-center justify-between shadow-[0_4px_20px_rgba(0,0,0,0.03)] transition-all duration-150 active:scale-[0.99] group cursor-pointer relative overflow-hidden"
            >
              {/* Subtle bottom-right leaf watermark */}
              <div className="absolute -right-2 -bottom-2 w-16 h-16 pointer-events-none select-none opacity-20 text-[#74B6A3]">
                <svg viewBox="0 0 50 50" fill="currentColor">
                  <path d="M 10 50 C 15 30 35 15 50 10 C 50 25 35 45 10 50 Z" />
                </svg>
              </div>

              {/* Left: Icon + Text Beside It (Strictly Horizontal Composition) */}
              <div className="flex items-center gap-3.5 sm:gap-4 relative z-10 text-left min-w-0 pr-2">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-[#E8F5F1] text-[#0D7E73] flex items-center justify-center shrink-0">
                  <svg
                    className="w-5.5 h-5.5 text-[#0D7E73]"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M4 4v16a1 1 0 0 0 1 1h8" />
                    <path d="M4 4h14a1 1 0 0 1 1 1v7" />
                    <line x1="8" y1="8" x2="14" y2="8" />
                    <line x1="8" y1="12" x2="12" y2="12" />
                    <polyline points="15 17 17 19 22 13" stroke="#0D7E73" strokeWidth="2.4" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <h3 className="font-medium text-[#0F172A] text-sm sm:text-base tracking-tight leading-tight">
                    Check Application Status
                  </h3>
                  <p className="text-slate-500 text-[11px] sm:text-xs font-normal mt-0.5">
                    Track your application easily
                  </p>
                </div>
              </div>

              {/* Right: Circular Arrow Button */}
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#E8F5F1] border border-[#C6E9E0] text-[#0D7E73] flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 group-hover:translate-x-0.5 transition-transform relative z-10">
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-[#0D7E73]" strokeWidth={2.2} />
              </div>
            </Link>
          </div>
        </section>

        {/* =================================================================== */}
        {/* STATS SECTION (RESPONSIVE: 3-COL ON DESKTOP, 2+1 ON MOBILE)         */}
        {/* =================================================================== */}
        <section className="bg-white rounded-3xl p-4 sm:p-5 md:p-6 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden">
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

          {/* DESKTOP VIEW: 3 Equal Columns Divided Vertically (Matching PC Reference) */}
          <div className="hidden md:grid md:grid-cols-3 divide-x divide-slate-100 relative z-10 items-center">
            {/* Stat 1: Lives Supported */}
            <div className="flex items-center gap-3.5 pr-4 pl-2">
              <div className="w-12 h-12 rounded-full bg-[#E0F4EE] text-[#0D7E73] flex items-center justify-center shrink-0 shadow-2xs">
                <Users className="w-5.5 h-5.5" />
              </div>
              <div className="text-left min-w-0">
                <div className="text-2xl font-semibold text-[#0F172A] tracking-tight leading-none">
                  1,250+
                </div>
                <div className="text-sm font-medium text-slate-800 leading-tight mt-1">
                  Lives Supported
                </div>
                <div className="text-xs text-slate-400 font-normal leading-tight mt-0.5">
                  Real people, real change
                </div>
              </div>
            </div>

            {/* Stat 2: Community Projects */}
            <div className="flex items-center gap-3.5 px-6">
              <div className="w-12 h-12 rounded-full bg-[#E0F4EE] text-[#0D7E73] flex items-center justify-center shrink-0 shadow-2xs">
                <Heart className="w-5.5 h-5.5 fill-[#0D7E73]" />
              </div>
              <div className="text-left min-w-0">
                <div className="text-2xl font-semibold text-[#0F172A] tracking-tight leading-none">
                  50+
                </div>
                <div className="text-sm font-medium text-slate-800 leading-tight mt-1">
                  Community Projects
                </div>
                <div className="text-xs text-slate-400 font-normal leading-tight mt-0.5">
                  Stronger communities
                </div>
              </div>
            </div>

            {/* Stat 3: For a Better Tomorrow */}
            <div className="flex items-center gap-3.5 pl-6">
              <div className="w-12 h-12 rounded-full bg-[#E0F4EE] text-[#0D7E73] flex items-center justify-center shrink-0 shadow-2xs">
                <Leaf className="w-5.5 h-5.5 text-[#0D7E73]" />
              </div>
              <div className="text-left min-w-0">
                <div className="text-2xl font-semibold text-[#0D7E73] tracking-tight leading-none">
                  100%
                </div>
                <div className="text-sm font-medium text-slate-800 leading-tight mt-1">
                  For a Better Tomorrow
                </div>
                <div className="text-xs text-slate-400 font-normal leading-tight mt-0.5">
                  Together we build a brighter future
                </div>
              </div>
            </div>
          </div>

          {/* MOBILE VIEW: 2 Columns on Top + 1 Bottom Centered (Matching Mobile Reference) */}
          <div className="md:hidden relative z-10">
            {/* Top Row: Two Stat Items */}
            <div className="grid grid-cols-2 divide-x divide-slate-100">
              {/* Stat Item 1: Lives Supported */}
              <div className="flex items-center gap-2 sm:gap-3.5 pr-1.5 sm:pr-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#E0F4EE] text-[#0D7E73] flex items-center justify-center shrink-0 shadow-2xs">
                  <Users className="w-4.5 h-4.5 sm:w-5.5 sm:h-5.5" />
                </div>
                <div className="text-left min-w-0">
                  <div className="text-lg sm:text-2xl font-semibold text-[#0F172A] tracking-tight leading-none">
                    1,250+
                  </div>
                  <div className="text-xs sm:text-sm font-medium text-slate-800 leading-tight mt-1">
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
                  <div className="text-lg sm:text-2xl font-semibold text-[#0F172A] tracking-tight leading-none">
                    50+
                  </div>
                  <div className="text-xs sm:text-sm font-medium text-slate-800 leading-tight mt-1">
                    Community Projects
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-slate-400 font-normal leading-tight mt-0.5">
                    Stronger communities every day
                  </div>
                </div>
              </div>
            </div>

            {/* Clean Horizontal Divider Line */}
            <div className="my-3.5 border-t border-slate-100" />

            {/* Bottom Row: 100% For a Better Tomorrow */}
            <div className="flex items-center justify-center gap-2.5 sm:gap-3">
              <div className="flex items-center gap-1.5 shrink-0">
                <Leaf className="w-4.5 h-4.5 text-[#0D7E73]" />
                <span className="text-lg sm:text-2xl font-semibold text-[#0D7E73] tracking-tight">
                  100%
                </span>
              </div>
              <div className="text-left">
                <div className="text-xs sm:text-sm font-medium text-slate-800 leading-tight">
                  For a Better Tomorrow
                </div>
                <div className="text-[10px] sm:text-[11px] text-slate-400 font-normal leading-tight mt-0.5">
                  Together we build a kinder, brighter future
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =================================================================== */}
        {/* OUR VALUES SECTION (RESPONSIVE: SLEEK BAR ON PC, FRAMED CARD ON MOB) */}
        {/* =================================================================== */}
        
        {/* DESKTOP VIEW: Sleek Horizontal Bar (Matching PC Reference Image) */}
        <section className="hidden md:flex items-center justify-between rounded-3xl bg-[#EEF7F4] border border-[#CCEAE0] px-6 py-4.5 shadow-[0_4px_24px_rgba(13,126,115,0.03)] relative overflow-hidden">
          {/* Left Label with Underline */}
          <div className="pr-6 shrink-0 border-r border-[#CCEAE0]">
            <span className="text-xs font-medium tracking-[0.2em] text-[#0D7E73] uppercase block">
              OUR VALUES
            </span>
            <span className="h-[2px] w-8 bg-[#0D7E73] block mt-1 rounded-full" />
          </div>

          {/* 4 Values Distributed Horizontally */}
          <div className="flex-1 grid grid-cols-4 divide-x divide-[#CCEAE0] text-left pl-6">
            {/* Value 1: Compassion */}
            <div className="flex items-center gap-3 px-4">
              <div className="w-10 h-10 rounded-full bg-[#DCF3EB] flex items-center justify-center shrink-0 shadow-2xs">
                <Heart className="w-4.5 h-4.5 text-[#0D7E73] fill-[#0D7E73]" />
              </div>
              <div>
                <h4 className="font-semibold text-[#0F172A] text-sm leading-tight">Compassion</h4>
                <p className="text-[11px] text-slate-500 font-normal mt-0.5">We care</p>
              </div>
            </div>

            {/* Value 2: Unity */}
            <div className="flex items-center gap-3 px-4">
              <div className="w-10 h-10 rounded-full bg-[#FEF3C7] flex items-center justify-center shrink-0 shadow-2xs">
                <Users className="w-4.5 h-4.5 text-[#D97706] fill-[#D97706]" />
              </div>
              <div>
                <h4 className="font-semibold text-[#0F172A] text-sm leading-tight">Unity</h4>
                <p className="text-[11px] text-slate-500 font-normal mt-0.5">We stand together</p>
              </div>
            </div>

            {/* Value 3: Service */}
            <div className="flex items-center gap-3 px-4">
              <div className="w-10 h-10 rounded-full bg-[#DCFCE7] flex items-center justify-center shrink-0 shadow-2xs">
                <Leaf className="w-4.5 h-4.5 text-[#16A34A]" />
              </div>
              <div>
                <h4 className="font-semibold text-[#0F172A] text-sm leading-tight">Service</h4>
                <p className="text-[11px] text-slate-500 font-normal mt-0.5">We take action</p>
              </div>
            </div>

            {/* Value 4: Impact */}
            <div className="flex items-center gap-3 px-4">
              <div className="w-10 h-10 rounded-full bg-[#E0F2FE] flex items-center justify-center shrink-0 shadow-2xs">
                <Star className="w-4.5 h-4.5 text-[#0284C7] fill-[#0284C7]" />
              </div>
              <div>
                <h4 className="font-semibold text-[#0F172A] text-sm leading-tight">Impact</h4>
                <p className="text-[11px] text-slate-500 font-normal mt-0.5">We create change</p>
              </div>
            </div>
          </div>
        </section>

        {/* MOBILE VIEW: Beautiful Framed Card (Matching Mobile Reference Image) */}
        <section className="md:hidden relative rounded-3xl bg-[#EEF7F4] border border-[#CCEAE0] shadow-[0_4px_24px_rgba(13,126,115,0.04)] px-2 sm:px-6 py-5 sm:py-6 overflow-hidden text-center">
          {/* Left Decorative Botanical Leaves */}
          <svg
            className="absolute -left-1 top-1.5 w-14 h-22 pointer-events-none select-none text-[#74B6A3]/65"
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
            className="absolute -right-1 top-1.5 w-14 h-22 pointer-events-none select-none text-[#74B6A3]/65"
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
          <div className="flex items-center justify-center gap-2.5 relative z-10">
            <span className="h-[1px] w-6 bg-[#7BBBAA]" aria-hidden="true" />
            <span className="text-[10px] font-medium tracking-[0.22em] text-[#2F7E6F] uppercase">
              OUR VALUES
            </span>
            <span className="h-[1px] w-6 bg-[#7BBBAA]" aria-hidden="true" />
          </div>

          {/* 4 Values Grid with Subtle Vertical Dividers */}
          <div className="grid grid-cols-4 divide-x divide-[#CCEAE0] mt-3.5 pt-0.5 relative z-10">
            {/* Value 1: Compassion */}
            <div className="px-0.5 sm:px-1 flex flex-col items-center text-center">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#DCF3EB] flex items-center justify-center mb-1.5 shadow-2xs">
                <Heart className="w-4 h-4 text-[#0D7E73] fill-[#0D7E73]" />
              </div>
              <h3 className="font-semibold text-[#0F172A] text-[11px] sm:text-xs tracking-tight">
                Compassion
              </h3>
              <p className="text-[9px] sm:text-[10px] text-slate-500 font-normal leading-tight mt-0.5">
                We care
              </p>
            </div>

            {/* Value 2: Unity */}
            <div className="px-0.5 sm:px-1 flex flex-col items-center text-center">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#FEF3C7] flex items-center justify-center mb-1.5 shadow-2xs">
                <Users className="w-4 h-4 text-[#D97706] fill-[#D97706]" />
              </div>
              <h3 className="font-semibold text-[#0F172A] text-[11px] sm:text-xs tracking-tight">
                Unity
              </h3>
              <p className="text-[9px] sm:text-[10px] text-slate-500 font-normal leading-tight mt-0.5">
                We stand together
              </p>
            </div>

            {/* Value 3: Service */}
            <div className="px-0.5 sm:px-1 flex flex-col items-center text-center">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#DCFCE7] flex items-center justify-center mb-1.5 shadow-2xs">
                <Leaf className="w-4 h-4 text-[#16A34A]" />
              </div>
              <h3 className="font-semibold text-[#0F172A] text-[11px] sm:text-xs tracking-tight">
                Service
              </h3>
              <p className="text-[9px] sm:text-[10px] text-slate-500 font-normal leading-tight mt-0.5">
                We take action
              </p>
            </div>

            {/* Value 4: Impact */}
            <div className="px-0.5 sm:px-1 flex flex-col items-center text-center">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#E0F2FE] flex items-center justify-center mb-1.5 shadow-2xs">
                <Star className="w-4 h-4 text-[#0284C7] fill-[#0284C7]" />
              </div>
              <h3 className="font-semibold text-[#0F172A] text-[11px] sm:text-xs tracking-tight">
                Impact
              </h3>
              <p className="text-[9px] sm:text-[10px] text-slate-500 font-normal leading-tight mt-0.5">
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
          <div className="flex justify-center mb-1.5 relative z-10">
            <svg className="w-6 h-6 text-[#D97706]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179z" />
            </svg>
          </div>
          
          <blockquote className="text-sm sm:text-base font-medium text-[#92400E] leading-relaxed tracking-tight max-w-xl mx-auto relative z-10">
            “In the service of humanity, for the pleasure of the Almighty”
          </blockquote>

          <HeroQuoteAuthor initialName={branding.foundationName} />
        </section>
      </main>

      {/* Reusable Public Footer */}
      <PublicFooter />
    </div>
  )
}
