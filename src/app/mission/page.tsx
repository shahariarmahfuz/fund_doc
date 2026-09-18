import { PublicHeader } from "@/components/public-header"
import Link from "next/link"
import { ArrowLeft, Compass, Eye, Sparkles } from "lucide-react"

export const metadata = {
  title: "Mission & Vision | Brotherhood Foundation",
  description: "Read the mission and vision statements of Brotherhood Foundation.",
}

export default function MissionPage() {
  return (
    <div className="min-h-dvh w-full relative bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-6 font-sans">
      <PublicHeader />

      <div className="relative z-10 w-full max-w-3xl mt-24 sm:mt-20 mb-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-teal-700 hover:text-teal-800 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <div className="bg-white/80 backdrop-blur-xl border border-white/60 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] rounded-3xl p-6 sm:p-10 space-y-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-100/60 text-emerald-700 rounded-2xl">
              <Compass className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Our Mission & Vision</h1>
              <p className="text-sm text-slate-500 font-medium">Guiding Principles and Long-term Aspiration</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="p-6 bg-emerald-50/50 rounded-2xl border border-emerald-100 space-y-3">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-lg">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                <h2>Our Mission</h2>
              </div>
              <p className="text-slate-700 text-sm sm:text-base leading-relaxed">
                To serve humanity selflessly by providing organized financial relief, ethical loan programs, and benevolent assistance to community members, while maintaining absolute transparency and accountability in all operations.
              </p>
            </div>

            <div className="p-6 bg-teal-50/50 rounded-2xl border border-teal-100 space-y-3">
              <div className="flex items-center gap-2 text-teal-800 font-bold text-lg">
                <Eye className="w-5 h-5 text-teal-600" />
                <h2>Our Vision</h2>
              </div>
              <p className="text-slate-700 text-sm sm:text-base leading-relaxed">
                A thriving, poverty-resilient community where every member has access to dignifying financial assistance, mutual support, and opportunities for social and economic growth.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
