import { PublicHeader } from "@/components/public-header"
import Link from "next/link"
import { ArrowLeft, Target, CheckCircle2 } from "lucide-react"

export const metadata = {
  title: "Our Goals | Brotherhood Foundation",
  description: "Explore the core objectives and goals of Brotherhood Foundation.",
}

export default function GoalsPage() {
  const goals = [
    "Provide interest-free microfinance (Qard Hasan) to enable self-reliance and entrepreneurship.",
    "Distribute non-repayable welfare assistance (Sadaqah) to poverty-stricken families and emergency victims.",
    "Streamline monthly membership contribution management and operational transparency.",
    "Ensure total financial integrity through centralized double-entry bookkeeping and audit trails.",
    "Build a united, empathetic community supporting sustainable social welfare programs."
  ]

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

        <div className="bg-white/80 backdrop-blur-xl border border-white/60 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] rounded-3xl p-6 sm:p-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-amber-100/60 text-amber-700 rounded-2xl">
              <Target className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Our Goals</h1>
              <p className="text-sm text-slate-500 font-medium">Strategic Objectives for Community Welfare</p>
            </div>
          </div>

          <div className="space-y-4">
            {goals.map((goal, index) => (
              <div key={index} className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <CheckCircle2 className="w-5 h-5 text-teal-600 mt-0.5 shrink-0" />
                <p className="text-slate-800 text-sm sm:text-base font-medium leading-relaxed">{goal}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
