import Link from "next/link"

export function PublicFooter() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="w-full relative overflow-hidden pt-8 pb-12 mt-10 text-center">
      {/* Subtle organic bottom wave decorations */}
      <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-[#E0F3EE]/50 blur-2xl pointer-events-none -z-10" />
      <div className="absolute -bottom-16 -right-16 w-48 h-48 rounded-full bg-[#D6EFE9]/50 blur-2xl pointer-events-none -z-10" />

      <div className="max-w-4xl mx-auto px-4 flex flex-col items-center space-y-4">
        {/* Public Navigation Links */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-semibold text-slate-500">
          <Link href="/about" className="hover:text-[#0D7E73] transition-colors">
            About Us
          </Link>
          <span className="text-slate-300">•</span>
          <Link href="/goals" className="hover:text-[#0D7E73] transition-colors">
            Our Goals
          </Link>
          <span className="text-slate-300">•</span>
          <Link href="/mission" className="hover:text-[#0D7E73] transition-colors">
            Our Mission
          </Link>
          <span className="text-slate-300">•</span>
          <Link href="/contact" className="hover:text-[#0D7E73] transition-colors">
            Contact Us
          </Link>
          <span className="text-slate-300">•</span>
          <Link href="/login" className="hover:text-[#0D7E73] transition-colors">
            Portal Login
          </Link>
        </div>

        {/* Copyright & Tagline */}
        <div className="space-y-1 pt-2">
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            © {currentYear} Bhratritva Foundation.
          </p>
          <p className="text-[11px] sm:text-xs text-slate-400">
            Together for a kinder, stronger community.
          </p>
        </div>
      </div>
    </footer>
  )
}
