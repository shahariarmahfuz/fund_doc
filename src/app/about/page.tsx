import Link from "next/link"
import { PublicHeader } from "@/components/public-header"
import { PublicFooter } from "@/components/public-footer"
import { Users, Heart, Award, ArrowLeft, ArrowRight } from "lucide-react"

export default function AboutPage() {
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
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#E0F2EE] border border-[#BBE3DA] text-[#0D7E73] text-xs font-semibold">
            <Users className="w-3.5 h-3.5" />
            Who We Are
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight">
            About Brotherhood Foundation
          </h1>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            Founded with the sole objective of serving humanity and elevating underprivileged families through solidarity, welfare assistance, and mutual support.
          </p>
        </div>

        {/* Content Cards */}
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-xs space-y-4">
            <div className="w-10 h-10 rounded-2xl bg-[#E8F5F1] text-[#0D7E73] flex items-center justify-center">
              <Heart className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-[#0F172A]">Our Journey & Foundations</h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              Brotherhood Foundation (Bhratritva Foundation) operates across local community groups to foster self-reliance, transparent collective savings, interest-free assistance, and emergency relief.
            </p>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              Every initiative is managed with strict double-entry accountability and automated governance, ensuring that every contribution reaches those who need it most.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-xs space-y-4">
            <div className="w-10 h-10 rounded-2xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-[#0F172A]">Core Pillars</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-4 rounded-2xl bg-[#F8FAF9] border border-slate-100">
                <h3 className="font-bold text-[#0F172A] text-sm">Transparency First</h3>
                <p className="text-slate-500 text-xs mt-1">Real-time ledger tracking, audited disbursements, and zero administrative waste.</p>
              </div>
              <div className="p-4 rounded-2xl bg-[#F8FAF9] border border-slate-100">
                <h3 className="font-bold text-[#0F172A] text-sm">Community-Driven</h3>
                <p className="text-slate-500 text-xs mt-1">Autonomous foundation groups working directly with vulnerable local households.</p>
              </div>
            </div>
          </div>

          {/* CTA Box */}
          <div className="rounded-3xl bg-[#0D7E73] p-6 sm:p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
            <div>
              <h3 className="text-lg font-bold">Ready to make an impact?</h3>
              <p className="text-teal-100 text-xs sm:text-sm mt-1">Join our foundation network and help uplift families in need.</p>
            </div>
            <Link
              href="/member-request"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white text-[#0D7E73] font-bold text-sm hover:bg-teal-50 transition-colors shrink-0"
            >
              Become a Member
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  )
}
