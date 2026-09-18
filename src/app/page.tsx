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
  CheckCircle2,
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

      {/* Main Content Area */}
      <main className="w-full max-w-lg sm:max-w-xl md:max-w-2xl mx-auto px-4 sm:px-6 pt-20 sm:pt-24 pb-8 space-y-4 sm:space-y-5 flex-1 relative z-10">
        
        {/* =================================================================== */}
        {/* HERO SECTION WITH MOSQUE VISUAL ATMOSPHERE                          */}
        {/* =================================================================== */}
        <section className="relative rounded-3xl pt-5 sm:pt-7 pb-2 overflow-hidden">
          {/* Subtle Mosque Hero Visual Background (Right-Aligned) */}
          <div className="absolute top-0 right-[-10px] sm:right-0 w-[62%] sm:w-[58%] h-full max-h-[380px] pointer-events-none select-none z-0">
            <div className="relative w-full h-full">
              <Image
                src="/images/hero-mosque.jpg"
                alt="Humanitarian Architecture"
                fill
                priority
                className="object-cover object-top rounded-2xl opacity-90 sm:opacity-95"
                sizes="(max-width: 640px) 60vw, 400px"
              />
              {/* Soft Gradient Overlay for Smooth Left and Bottom Blending */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#EFF8F6] via-[#EFF8F6]/75 sm:via-[#EFF8F6]/60 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#EFF8F6] via-transparent to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-b from-[#EFF8F6]/40 via-transparent to-transparent" />
            </div>
          </div>

          {/* Hero Foreground Content */}
          <div className="relative z-10 space-y-3 sm:space-y-4 max-w-[280px] sm:max-w-sm">
            {/* Pill Category Badge */}
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#E0F2EE]/90 backdrop-blur-xs border border-[#BBE3DA] text-[#0D7E73] text-[11px] sm:text-xs font-semibold shadow-2xs">
              <Leaf className="w-3.5 h-3.5 text-[#0D7E73] shrink-0" />
              <span>People • Support • Change</span>
            </div>

            {/* Main Brotherhood Foundation Title */}
            <div className="space-y-0.5">
              <h1 className="text-[34px] sm:text-5xl font-black text-[#0F172A] tracking-tight leading-[1.08]">
                Brotherhood
              </h1>
              <h1 className="text-[34px] sm:text-5xl font-black text-[#0D7E73] tracking-tight leading-[1.08]">
                Foundation
              </h1>
            </div>

            {/* Humanitarian Mission Statement */}
            <p className="text-slate-600 font-medium text-xs sm:text-[15px] leading-relaxed">
              In the service of humanity,
              <br />
              for the pleasure of the Almighty
            </p>
          </div>

          {/* Call To Action Buttons (Full Width) */}
          <div className="relative z-10 w-full space-y-2.5 pt-5">
            {/* Primary Action: Become a Member */}
            <Link
              href="/member-request"
              className="w-full h-13 sm:h-14 rounded-2xl bg-[#0D7E73] hover:bg-[#0A6B62] active:bg-[#085A52] text-white font-bold text-sm sm:text-base flex items-center justify-between px-5 sm:px-6 shadow-[0_10px_25px_-5px_rgba(13,126,115,0.38)] transition-all duration-150 active:scale-[0.99] group cursor-pointer"
            >
              <span className="flex items-center gap-3">
                <UserPlus className="w-5 h-5 sm:w-5.5 sm:h-5.5 text-white/95" />
                <span>Become a Member</span>
              </span>
              <ArrowRight className="w-5 h-5 text-white/90 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            {/* Secondary Action: Check Application Status */}
            <Link
              href="/member-request/status"
              className="w-full h-13 sm:h-14 rounded-2xl bg-white/95 hover:bg-slate-50 active:bg-slate-100 text-[#0F172A] font-bold text-sm sm:text-base border border-slate-200/90 flex items-center justify-between px-5 sm:px-6 shadow-xs transition-all duration-150 active:scale-[0.99] group cursor-pointer"
            >
              <span className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 sm:w-5.5 sm:h-5.5 text-[#0D7E73]" />
                <span>Check Application Status</span>
              </span>
              <ArrowRight className="w-5 h-5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </section>

        {/* =================================================================== */}
        {/* STATS SECTION (ROUNDED CARD WITH 3 MEANINGFUL METRICS)              */}
        {/* =================================================================== */}
        <section className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100/90 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="grid grid-cols-3 divide-x divide-slate-100 text-center">
            {/* Metric 1 */}
            <div className="px-1.5 sm:px-3 flex flex-col items-center">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#E8F5F1] text-[#0D7E73] flex items-center justify-center mb-1.5 sm:mb-2 shadow-2xs">
                <Users className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <span className="text-base sm:text-2xl font-black text-[#0F172A] tracking-tight">
                1,250+
              </span>
              <span className="text-[10px] sm:text-xs text-slate-500 font-medium leading-tight mt-0.5">
                Lives Supported
              </span>
            </div>

            {/* Metric 2 */}
            <div className="px-1.5 sm:px-3 flex flex-col items-center">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#E8F5F1] text-[#0D7E73] flex items-center justify-center mb-1.5 sm:mb-2 shadow-2xs">
                <Heart className="w-4 h-4 sm:w-5 sm:h-5 fill-[#0D7E73]" />
              </div>
              <span className="text-base sm:text-2xl font-black text-[#0F172A] tracking-tight">
                50+
              </span>
              <span className="text-[10px] sm:text-xs text-slate-500 font-medium leading-tight mt-0.5">
                Community Projects
              </span>
            </div>

            {/* Metric 3 */}
            <div className="px-1.5 sm:px-3 flex flex-col items-center">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#E8F5F1] text-[#0D7E73] flex items-center justify-center mb-1.5 sm:mb-2 shadow-2xs">
                <Leaf className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <span className="text-base sm:text-2xl font-black text-[#0F172A] tracking-tight">
                100%
              </span>
              <span className="text-[10px] sm:text-xs text-slate-500 font-medium leading-tight mt-0.5">
                For a Better Tomorrow
              </span>
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
          {/* Subtle Decorative Golden Quote Mark */}
          <div className="text-[#D97706] text-3xl sm:text-4xl font-serif font-black leading-none mb-1 select-none">
            “
          </div>
          
          <blockquote className="text-sm sm:text-base font-bold text-[#92400E] leading-snug tracking-tight max-w-sm sm:max-w-md mx-auto">
            "In the service of humanity,
            <br />
            for the pleasure of the Almighty"
          </blockquote>

          <cite className="text-[11px] sm:text-xs font-semibold text-[#B45309]/85 mt-2 sm:mt-2.5 block tracking-normal not-italic">
            — Brotherhood Foundation
          </cite>
        </section>
      </main>

      {/* Reusable Public Footer */}
      <PublicFooter />
    </div>
  )
}
