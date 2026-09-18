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
  Target,
  Compass,
  Mail,
  UserPlus,
  CheckCircle2,
  ArrowRight,
  Sparkles,
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
        {/* QUICK ACCESS CARDS (4 COMPACT ROUNDED CARDS)                        */}
        {/* =================================================================== */}
        <section className="grid grid-cols-4 gap-2 sm:gap-3">
          {/* Card 1: About Us */}
          <Link
            href="/about"
            className="bg-white rounded-2xl sm:rounded-3xl p-2.5 sm:p-4 text-center border border-slate-100 shadow-[0_4px_16px_rgba(0,0,0,0.03)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 flex flex-col justify-between items-center group cursor-pointer"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#E8F5F1] text-[#0D7E73] flex items-center justify-center mb-2 shrink-0">
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="space-y-0.5">
              <h3 className="font-bold text-[#0F172A] text-xs sm:text-sm leading-tight">
                About Us
              </h3>
              <p className="text-[9px] sm:text-[11px] text-slate-400 font-normal line-clamp-1">
                Know our journey
              </p>
            </div>
            <div className="w-6 h-6 rounded-full bg-[#E8F5F1] text-[#0D7E73] flex items-center justify-center mt-2.5 group-hover:bg-[#0D7E73] group-hover:text-white transition-colors">
              <ArrowRight className="w-3 h-3" />
            </div>
          </Link>

          {/* Card 2: Our Goals */}
          <Link
            href="/goals"
            className="bg-white rounded-2xl sm:rounded-3xl p-2.5 sm:p-4 text-center border border-slate-100 shadow-[0_4px_16px_rgba(0,0,0,0.03)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 flex flex-col justify-between items-center group cursor-pointer"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#FEF3C7] text-[#D97706] flex items-center justify-center mb-2 shrink-0">
              <Target className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="space-y-0.5">
              <h3 className="font-bold text-[#0F172A] text-xs sm:text-sm leading-tight">
                Our Goals
              </h3>
              <p className="text-[9px] sm:text-[11px] text-slate-400 font-normal line-clamp-1">
                What we aim for
              </p>
            </div>
            <div className="w-6 h-6 rounded-full bg-[#E8F5F1] text-[#0D7E73] flex items-center justify-center mt-2.5 group-hover:bg-[#0D7E73] group-hover:text-white transition-colors">
              <ArrowRight className="w-3 h-3" />
            </div>
          </Link>

          {/* Card 3: Our Mission */}
          <Link
            href="/mission"
            className="bg-white rounded-2xl sm:rounded-3xl p-2.5 sm:p-4 text-center border border-slate-100 shadow-[0_4px_16px_rgba(0,0,0,0.03)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 flex flex-col justify-between items-center group cursor-pointer"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center mb-2 shrink-0">
              <Compass className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="space-y-0.5">
              <h3 className="font-bold text-[#0F172A] text-xs sm:text-sm leading-tight">
                Our Mission
              </h3>
              <p className="text-[9px] sm:text-[11px] text-slate-400 font-normal line-clamp-1">
                Our vision for change
              </p>
            </div>
            <div className="w-6 h-6 rounded-full bg-[#E8F5F1] text-[#0D7E73] flex items-center justify-center mt-2.5 group-hover:bg-[#0D7E73] group-hover:text-white transition-colors">
              <ArrowRight className="w-3 h-3" />
            </div>
          </Link>

          {/* Card 4: Contact Us */}
          <Link
            href="/contact"
            className="bg-white rounded-2xl sm:rounded-3xl p-2.5 sm:p-4 text-center border border-slate-100 shadow-[0_4px_16px_rgba(0,0,0,0.03)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 flex flex-col justify-between items-center group cursor-pointer"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center mb-2 shrink-0">
              <Mail className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="space-y-0.5">
              <h3 className="font-bold text-[#0F172A] text-xs sm:text-sm leading-tight">
                Contact Us
              </h3>
              <p className="text-[9px] sm:text-[11px] text-slate-400 font-normal line-clamp-1">
                Get in touch
              </p>
            </div>
            <div className="w-6 h-6 rounded-full bg-[#E8F5F1] text-[#0D7E73] flex items-center justify-center mt-2.5 group-hover:bg-[#0D7E73] group-hover:text-white transition-colors">
              <ArrowRight className="w-3 h-3" />
            </div>
          </Link>
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
