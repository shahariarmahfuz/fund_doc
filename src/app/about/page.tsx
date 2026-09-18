import { PublicHeader } from "@/components/public-header"
import Link from "next/link"
import { ArrowLeft, Info, Heart, Users, Award } from "lucide-react"

export const metadata = {
  title: "About Us | Brotherhood Foundation",
  description: "Learn more about Brotherhood Foundation and our welfare initiatives.",
}

export default function AboutPage() {
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
            <div className="p-3 bg-teal-100/60 text-teal-700 rounded-2xl">
              <Info className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">About Us</h1>
              <p className="text-sm text-slate-500 font-medium">Brotherhood Foundation ERP & Welfare Portal</p>
            </div>
          </div>

          <div className="prose prose-slate max-w-none space-y-4 text-slate-700 leading-relaxed text-sm sm:text-base">
            <p>
              <strong>Brotherhood Foundation</strong> is a non-profit, community welfare organization dedicated to empowering individuals, assisting needy families, providing microfinance support through Qard Hasan, and managing Sadaqah initiatives transparently.
            </p>
            <p>
              Our centralized ERP system provides end-to-end accountability, digital record keeping, double-entry financial ledger integrity, and efficient management of community members, donors, and welfare beneficiaries.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-slate-200/80">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center text-center">
                <Heart className="w-6 h-6 text-teal-600 mb-2" />
                <h3 className="font-bold text-slate-900 text-sm">Compassion</h3>
                <p className="text-xs text-slate-500 mt-1">Sincere care and aid for every individual in need.</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center text-center">
                <Users className="w-6 h-6 text-amber-600 mb-2" />
                <h3 className="font-bold text-slate-900 text-sm">Community</h3>
                <p className="text-xs text-slate-500 mt-1">Strengthening bonds and shared responsibility.</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center text-center">
                <Award className="w-6 h-6 text-emerald-600 mb-2" />
                <h3 className="font-bold text-slate-900 text-sm">Integrity</h3>
                <p className="text-xs text-slate-500 mt-1">100% transparent financial tracking and audit trails.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
