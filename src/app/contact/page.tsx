import Link from "next/link"
import { PublicHeader } from "@/components/public-header"
import { PublicFooter } from "@/components/public-footer"
import { Mail, MapPin, Phone, ArrowLeft, ArrowRight, Clock, MessageSquare } from "lucide-react"
import { getBrandingSettings } from "@/lib/branding"

export default async function ContactPage() {
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
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#E0F2FE] border border-[#BAE6FD] text-[#0284C7] text-xs font-semibold">
            <Mail className="w-3.5 h-3.5" />
            Reach Out
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight">
            Contact {foundationName}
          </h1>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            Have questions about membership, foundation groups, or welfare programs? We are here to assist you.
          </p>
        </div>

        {/* Contact Info Cards */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-[#E8F5F1] text-[#0D7E73] flex items-center justify-center">
                <Mail className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-[#0F172A]">Email Inquiries</h2>
              <p className="text-slate-600 text-xs sm:text-sm">For official correspondence and welfare questions:</p>
              <p className="text-xs sm:text-sm font-semibold text-[#0D7E73]">contact@brotherhoodfoundation.org</p>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-[#0F172A]">Member Assistance</h2>
              <p className="text-slate-600 text-xs sm:text-sm">Track active applications or verify status:</p>
              <Link href="/member-request/status" className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-[#0D7E73] hover:underline">
                Check Status Portal →
              </Link>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-[#0F172A]">Operating Hours</h2>
              <p className="text-slate-600 text-xs sm:text-sm">Administrative response hours:</p>
              <p className="text-xs sm:text-sm font-semibold text-slate-700">Saturday – Thursday: 9:00 AM – 6:00 PM</p>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center">
                <MapPin className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-[#0F172A]">Headquarters</h2>
              <p className="text-slate-600 text-xs sm:text-sm">Central Administrative Secretariat:</p>
              <p className="text-xs sm:text-sm font-semibold text-slate-700">Dhaka, Bangladesh</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-xs text-center space-y-3 mt-4">
            <h3 className="text-lg font-bold text-[#0F172A]">Want to join our foundation?</h3>
            <p className="text-slate-500 text-xs sm:text-sm max-w-md mx-auto">
              Submit an online member request to connect with your local foundation group and participate in our monthly welfare pool.
            </p>
            <div className="pt-2">
              <Link
                href="/member-request"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-[#0D7E73] hover:bg-[#0A625A] text-white font-bold text-sm shadow-sm transition-all"
              >
                Apply for Membership
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  )
}
