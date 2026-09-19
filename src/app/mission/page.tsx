import Link from "next/link"
import { PublicHeader } from "@/components/public-header"
import { PublicFooter } from "@/components/public-footer"
import { Compass, Sparkles, HeartHandshake, ArrowLeft, ArrowRight, Quote } from "lucide-react"
import { getBrandingSettings } from "@/lib/branding"

export default async function MissionPage() {
  const branding = await getBrandingSettings()
  const foundationName = branding.foundationName || "Our Foundation"

  return (
    <div className="min-h-dvh w-full bg-[#F4FAF8] text-[#0F172A] font-sans flex flex-col justify-between">
      <PublicHeader />

      <main className="w-full max-w-3xl mx-auto px-4 sm:px-6 pt-24 pb-12 flex-1">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#0D7E73] hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>

        {/* Header Badge */}
        <div className="space-y-3 mb-8">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#DCFCE7] border border-[#BBF7D0] text-[#16A34A] text-xs font-semibold">
            <Compass className="w-3.5 h-3.5" />
            Purpose & Vision
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight">
            Our Mission & Vision
          </h1>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            Cultivating brotherhood, dignity, and collective uplift through faith-inspired social action and humanitarian stewardship.
          </p>
        </div>

        {/* Mission Quote Card */}
        <div className="bg-[#FEF7EA] rounded-3xl p-6 sm:p-8 border border-[#FDE68A]/80 text-center relative mb-6 shadow-2xs">
          <Quote className="w-8 h-8 text-[#D97706]/70 mx-auto mb-2" />
          <p className="text-lg sm:text-xl font-bold text-[#92400E] italic leading-relaxed">
            "In the service of humanity, for the pleasure of the Almighty"
          </p>
          <span className="text-xs font-semibold text-[#B45309]/80 mt-2 block tracking-wider uppercase">
            — {foundationName} Creed
          </span>
        </div>

        {/* Mission & Vision Cards */}
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E8F5F1] text-[#0D7E73] flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-[#0F172A]">The Mission</h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              To empower community members to pool resources systematically, enabling zero-interest financing, essential medical coverage, poverty relief, and family welfare support with complete digital transparency and mutual brotherly love.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-[#0F172A]">The Vision</h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              A resilient, self-sufficient society where no family is left behind due to financial hardship, where brotherhood is lived through shared responsibility, and where welfare is delivered with the highest standard of honor and dignity.
            </p>
          </div>

          <div className="pt-4 text-center">
            <Link
              href="/member-request"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-[#0D7E73] hover:bg-[#0A625A] text-white font-bold text-sm shadow-sm transition-all"
            >
              Become a Member Today
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  )
}
