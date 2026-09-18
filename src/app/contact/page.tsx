import { PublicHeader } from "@/components/public-header"
import Link from "next/link"
import { ArrowLeft, Mail, MapPin, Phone, Clock } from "lucide-react"

export const metadata = {
  title: "Contact Us | Brotherhood Foundation",
  description: "Get in touch with Brotherhood Foundation for inquiries and assistance.",
}

export default function ContactPage() {
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

        <div className="bg-white/80 backdrop-blur-xl border border-white/60 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] rounded-3xl p-6 sm:p-10 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-sky-100/60 text-sky-700 rounded-2xl">
              <Mail className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Contact Us</h1>
              <p className="text-sm text-slate-500 font-medium">Reach out to our executive administration</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-3">
              <MapPin className="w-5 h-5 text-teal-600 mt-1 shrink-0" />
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Main Office</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Brotherhood Foundation Headquarters<br />
                  Central Welfare Complex, Dhaka, Bangladesh
                </p>
              </div>
            </div>

            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-3">
              <Mail className="w-5 h-5 text-sky-600 mt-1 shrink-0" />
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Email Support</h3>
                <p className="text-xs text-slate-600 mt-1">support@brotherhoodfoundation.org</p>
                <p className="text-xs text-slate-600">info@brotherhoodfoundation.org</p>
              </div>
            </div>

            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-3">
              <Phone className="w-5 h-5 text-amber-600 mt-1 shrink-0" />
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Helpline</h3>
                <p className="text-xs text-slate-600 mt-1">+880 1700-000000</p>
                <p className="text-xs text-slate-600">+880 1800-000000</p>
              </div>
            </div>

            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-3">
              <Clock className="w-5 h-5 text-emerald-600 mt-1 shrink-0" />
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Office Hours</h3>
                <p className="text-xs text-slate-600 mt-1">Saturday - Thursday</p>
                <p className="text-xs text-slate-600">9:00 AM - 5:00 PM (GMT+6)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
