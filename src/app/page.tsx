import Link from "next/link"
import { PublicHeader } from "@/components/public-header"
import { getAuthSession } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function PublicHomepage() {
  const session = await getAuthSession()
  const user = session?.user as any
  if (user?.id) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-dvh w-full relative bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-6 font-sans">
      <PublicHeader />
      
      {/* Static Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[10%] -left-[10%] w-[60vw] h-[60vw] rounded-full bg-teal-500/10 blur-[80px] opacity-70 mix-blend-multiply" />
        <div className="absolute top-[20%] -right-[15%] w-[70vw] h-[70vw] rounded-full bg-amber-500/10 blur-[100px] opacity-60 mix-blend-multiply" />
        <div className="absolute -bottom-[20%] left-[10%] w-[60vw] h-[60vw] rounded-full bg-emerald-500/10 blur-[90px] opacity-60 mix-blend-multiply" />
      </div>

      <div className="relative z-10 w-full max-w-[28rem] mt-20 sm:mt-16">
        {/* Glassmorphism Card */}
        <div className="bg-white/70 backdrop-blur-xl border border-white/60 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] rounded-3xl p-6 sm:p-8 md:p-10 flex flex-col items-center text-center">
          
          {/* Typography Header */}
          <div className="space-y-3 mb-10 w-full">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Brotherhood Foundation
            </h1>
            <h2 className="text-xl sm:text-2xl font-bold text-teal-700">
              Foundation ERP
            </h2>
            <div className="pt-2">
              <span className="inline-block px-4 py-1.5 rounded-full bg-amber-100/50 border border-amber-200/50">
                <p className="text-sm sm:text-base font-semibold text-amber-700 italic">
                  "In the service of humanity, for the pleasure of the Almighty"
                </p>
              </span>
            </div>
          </div>

          {/* Primary & Secondary Actions */}
          <div className="w-full space-y-4">
            <Link 
              href="/member-request" 
              className="flex items-center justify-center w-full h-14 sm:h-16 px-6 rounded-2xl bg-teal-600 text-white font-semibold text-base sm:text-lg hover:bg-teal-700 active:bg-teal-800 transition-colors"
            >
              <span className="flex items-center gap-2.5">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                Become a Member
              </span>
            </Link>

            <Link 
              href="/member-request/status" 
              className="flex items-center justify-center w-full h-14 sm:h-16 px-6 rounded-2xl bg-white/80 text-slate-700 font-semibold text-base sm:text-lg border-2 border-slate-200 hover:bg-slate-100 active:bg-slate-200 transition-colors"
            >
              <span className="flex items-center gap-2.5">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Check Application Status
              </span>
            </Link>
          </div>
          
        </div>
        
        {/* Soft Footer Copy */}
        <div className="text-center mt-8 opacity-60">
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            © {new Date().getFullYear()} Bhratritya Foundation.
          </p>
        </div>
      </div>
    </div>
  )
}
