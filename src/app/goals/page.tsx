import Link from "next/link"
import { PublicHeader } from "@/components/public-header"
import { PublicFooter } from "@/components/public-footer"
import { Target, CheckCircle2, ArrowLeft, ArrowRight, ShieldCheck } from "lucide-react"
import { getBrandingSettings } from "@/lib/branding"

export default async function GoalsPage() {
  const branding = await getBrandingSettings()
  const foundationName = branding.foundationName || "Our Foundation"

  const goals = [
    {
      title: "Poverty Alleviation & Micro-Welfare",
      desc: "Providing interest-free Qard Hasan and welfare Sadaqah to help struggling households build sustainable livelihood opportunities.",
      color: "bg-[#E8F5F1] text-[#0D7E73]"
    },
    {
      title: "Transparent Community Fund Collection",
      desc: "Organizing collective monthly contributions with real-time double-entry ledger oversight so every member can see their impact.",
      color: "bg-[#FEF3C7] text-[#D97706]"
    },
    {
      title: "Emergency Medical & Disaster Support",
      desc: "Delivering rapid, dignified humanitarian grants and aid during medical crises, natural catastrophes, and unexpected family emergencies.",
      color: "bg-[#DCFCE7] text-[#16A34A]"
    },
    {
      title: "Educational Empowerment",
      desc: "Sponsoring school fees, learning materials, and skills training for promising youth from marginalized backgrounds.",
      color: "bg-[#E0F2FE] text-[#0284C7]"
    }
  ]

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
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#FEF3C7] border border-[#FDE68A] text-[#D97706] text-xs font-semibold">
            <Target className="w-3.5 h-3.5" />
            Our Strategic Focus
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight">
            Our Goals & Objectives
          </h1>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            Concrete humanitarian goals driving every action, contribution, and welfare program undertaken by {foundationName}.
          </p>
        </div>

        {/* Goals Grid */}
        <div className="space-y-4">
          {goals.map((goal, idx) => (
            <div key={idx} className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-100 shadow-xs flex items-start gap-4">
              <div className={`w-10 h-10 rounded-2xl ${goal.color} flex items-center justify-center shrink-0 mt-0.5`}>
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h2 className="text-base sm:text-lg font-bold text-[#0F172A]">{goal.title}</h2>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">{goal.desc}</p>
              </div>
            </div>
          ))}

          {/* Commitment Card */}
          <div className="bg-[#FEF7EA] rounded-3xl p-6 sm:p-7 border border-[#FDE68A]/70 text-center space-y-2 mt-6">
            <ShieldCheck className="w-7 h-7 text-[#D97706] mx-auto" />
            <h3 className="font-bold text-[#92400E] text-base">Our 100% Ethical Guarantee</h3>
            <p className="text-xs sm:text-sm text-[#B45309] max-w-md mx-auto leading-relaxed">
              Every penny collected is logged directly into our transparent public ledger with complete audit accountability.
            </p>
          </div>

          <div className="pt-4 text-center">
            <Link
              href="/member-request"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-[#0D7E73] hover:bg-[#0A625A] text-white font-bold text-sm shadow-sm transition-all"
            >
              Apply to Join Our Mission
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  )
}
