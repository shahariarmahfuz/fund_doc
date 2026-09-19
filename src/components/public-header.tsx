"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  X,
  Info,
  Target,
  Compass,
  Mail,
  Home,
  UserPlus,
  CheckCircle2,
  LogIn,
  ArrowRight,
  Search,
} from "lucide-react"
import { useBranding } from "@/components/providers/branding-provider"

function getInitials(name?: string, shortName?: string): string {
  if (shortName && shortName.trim().length <= 3) {
    return shortName.trim().toUpperCase()
  }
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name.trim().slice(0, 2).toUpperCase()
  }
  return "BF"
}

export function PublicHeader() {
  const [isOpen, setIsOpen] = useState(false)
  const branding = useBranding()
  const pathname = usePathname()
  const initials = getInitials(branding.foundationName, branding.shortName)

  // Close drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false)
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Prevent background scroll when side drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  // Automatically close drawer when route changes
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  return (
    <>
      <header className="fixed top-0 left-0 w-full z-40 px-4 sm:px-8 py-3 bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-xs transition-all">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Brand Identity */}
          <Link
            href="/"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2.5 sm:gap-3 group hover:opacity-90 transition-opacity"
          >
            <div className="w-10 h-10 drop-shadow-xs flex items-center justify-center shrink-0">
              {branding.loginLogo || branding.logo || branding.headerLogo ? (
                <img
                  src={branding.loginLogo || branding.logo || branding.headerLogo!}
                  alt={branding.foundationName || "Foundation"}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full rounded-2xl bg-gradient-to-br from-[#0D7E73] to-[#0A625A] text-white font-extrabold flex items-center justify-center text-xs shadow-inner">
                  {initials}
                </div>
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-[15px] sm:text-base font-extrabold text-[#0F172A] leading-tight tracking-tight">
                {branding.foundationName || "Foundation"}
              </span>
              <span className="text-[11px] sm:text-xs font-semibold text-[#0D7E73] leading-tight">
                Welfare Organization
              </span>
            </div>
          </Link>

          {/* Desktop Center Navigation Links (Visible on md+) */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-sm font-semibold text-slate-600">
            <Link
              href="/"
              className={`transition-colors relative py-1 ${
                pathname === "/" ? "text-[#0D7E73] font-bold" : "hover:text-[#0D7E73]"
              }`}
            >
              Home
              {pathname === "/" && (
                <span className="absolute bottom-0 left-0 w-full h-[2.5px] bg-[#0D7E73] rounded-full" />
              )}
            </Link>
            <Link
              href="/about"
              className={`transition-colors relative py-1 ${
                pathname === "/about" ? "text-[#0D7E73] font-bold" : "hover:text-[#0D7E73]"
              }`}
            >
              About
              {pathname === "/about" && (
                <span className="absolute bottom-0 left-0 w-full h-[2.5px] bg-[#0D7E73] rounded-full" />
              )}
            </Link>
            <Link
              href="/goals"
              className={`transition-colors relative py-1 ${
                pathname === "/goals" ? "text-[#0D7E73] font-bold" : "hover:text-[#0D7E73]"
              }`}
            >
              Programs
              {pathname === "/goals" && (
                <span className="absolute bottom-0 left-0 w-full h-[2.5px] bg-[#0D7E73] rounded-full" />
              )}
            </Link>
            <Link
              href="/mission"
              className={`transition-colors relative py-1 ${
                pathname === "/mission" ? "text-[#0D7E73] font-bold" : "hover:text-[#0D7E73]"
              }`}
            >
              News
              {pathname === "/mission" && (
                <span className="absolute bottom-0 left-0 w-full h-[2.5px] bg-[#0D7E73] rounded-full" />
              )}
            </Link>
            <Link
              href="/about"
              className="hover:text-[#0D7E73] transition-colors py-1"
            >
              Gallery
            </Link>
            <Link
              href="/contact"
              className={`transition-colors relative py-1 ${
                pathname === "/contact" ? "text-[#0D7E73] font-bold" : "hover:text-[#0D7E73]"
              }`}
            >
              Contact
              {pathname === "/contact" && (
                <span className="absolute bottom-0 left-0 w-full h-[2.5px] bg-[#0D7E73] rounded-full" />
              )}
            </Link>
          </nav>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Desktop Search Button */}
            <div className="hidden sm:flex w-10 h-10 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-slate-500 hover:text-slate-800 items-center justify-center transition-colors cursor-pointer shadow-2xs">
              <Search className="w-4 h-4" />
            </div>

            {/* Premium Minimal 3-Line Navigation Icon Button */}
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#E8F5F1] hover:bg-[#D8EFE8] active:bg-[#CCEAE2] border border-[#C6E9E0] text-[#0D7E73] flex items-center justify-center transition-all duration-200 shadow-2xs active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#0D7E73]/30 cursor-pointer"
              aria-label="Open navigation menu"
              aria-expanded={isOpen}
            >
              <svg
                className="w-5 h-5 text-[#0D7E73]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="4" y1="7" x2="20" y2="7" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="17" x2="20" y2="17" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Backdrop (Darkened overlay with subtle blur) */}
      <div
        onClick={() => setIsOpen(false)}
        className={`fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-50 transition-opacity duration-300 ease-out ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden="true"
      />

      {/* SIDE NAVIGATION DRAWER (Slides smoothly from the right) */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Public Navigation Drawer"
        className={`fixed top-0 right-0 h-dvh w-[82vw] max-w-[320px] sm:max-w-[340px] bg-white z-50 shadow-[-12px_0_36px_rgba(15,23,42,0.15)] border-l border-slate-100 flex flex-col justify-between transition-transform duration-300 ease-out transform ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Drawer Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#E8F5F1] text-[#0D7E73] flex items-center justify-center font-bold text-xs">
              {initials}
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-sm text-[#0F172A] leading-tight">
                {branding.foundationName || "Foundation"}
              </span>
              <span className="text-[10px] font-semibold text-[#0D7E73] uppercase tracking-wider">
                Public Navigation
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close navigation menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drawer Body / Menu Items */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          {/* Item: Home */}
          <Link
            href="/"
            onClick={() => setIsOpen(false)}
            className={`flex items-center justify-between px-3.5 py-3 rounded-xl transition-all duration-150 group cursor-pointer ${
              pathname === "/"
                ? "bg-[#E8F5F1] text-[#0D7E73] font-bold"
                : "text-slate-800 hover:bg-slate-50 font-medium"
            }`}
          >
            <div className="flex items-center gap-3">
              <Home
                className={`w-4.5 h-4.5 shrink-0 transition-colors ${
                  pathname === "/" ? "text-[#0D7E73]" : "text-slate-400 group-hover:text-[#0D7E73]"
                }`}
                strokeWidth={2}
              />
              <span className="text-sm">Home</span>
            </div>
            <ArrowRight
              className={`w-4 h-4 transition-transform group-hover:translate-x-0.5 ${
                pathname === "/" ? "text-[#0D7E73]" : "text-slate-300 group-hover:text-[#0D7E73]"
              }`}
            />
          </Link>

          {/* Item: Become a Member */}
          <Link
            href="/member-request"
            onClick={() => setIsOpen(false)}
            className={`flex items-center justify-between px-3.5 py-3 rounded-xl transition-all duration-150 group cursor-pointer ${
              pathname === "/member-request"
                ? "bg-[#E8F5F1] text-[#0D7E73] font-bold"
                : "text-slate-800 hover:bg-[#E8F5F1]/50 font-medium"
            }`}
          >
            <div className="flex items-center gap-3">
              <UserPlus
                className={`w-4.5 h-4.5 shrink-0 transition-colors ${
                  pathname === "/member-request"
                    ? "text-[#0D7E73]"
                    : "text-[#0D7E73]/80 group-hover:text-[#0D7E73]"
                }`}
                strokeWidth={2}
              />
              <span className="text-sm">Become a Member</span>
            </div>
            <ArrowRight
              className={`w-4 h-4 transition-transform group-hover:translate-x-0.5 ${
                pathname === "/member-request"
                  ? "text-[#0D7E73]"
                  : "text-slate-300 group-hover:text-[#0D7E73]"
              }`}
            />
          </Link>

          {/* Item: Check Application Status */}
          <Link
            href="/member-request/status"
            onClick={() => setIsOpen(false)}
            className={`flex items-center justify-between px-3.5 py-3 rounded-xl transition-all duration-150 group cursor-pointer ${
              pathname === "/member-request/status"
                ? "bg-[#E8F5F1] text-[#0D7E73] font-bold"
                : "text-slate-800 hover:bg-slate-50 font-medium"
            }`}
          >
            <div className="flex items-center gap-3">
              <CheckCircle2
                className={`w-4.5 h-4.5 shrink-0 transition-colors ${
                  pathname === "/member-request/status"
                    ? "text-[#0D7E73]"
                    : "text-slate-400 group-hover:text-[#0D7E73]"
                }`}
                strokeWidth={2}
              />
              <span className="text-sm">Check Application Status</span>
            </div>
            <ArrowRight
              className={`w-4 h-4 transition-transform group-hover:translate-x-0.5 ${
                pathname === "/member-request/status"
                  ? "text-[#0D7E73]"
                  : "text-slate-300 group-hover:text-[#0D7E73]"
              }`}
            />
          </Link>

          {/* Clean Minimal Section Divider */}
          <div className="py-2">
            <div className="h-px bg-slate-100" />
          </div>

          {/* Item: About Us */}
          <Link
            href="/about"
            onClick={() => setIsOpen(false)}
            className={`flex items-center justify-between px-3.5 py-3 rounded-xl transition-all duration-150 group cursor-pointer ${
              pathname === "/about"
                ? "bg-[#E8F5F1] text-[#0D7E73] font-bold"
                : "text-slate-800 hover:bg-slate-50 font-medium"
            }`}
          >
            <div className="flex items-center gap-3">
              <Info
                className={`w-4.5 h-4.5 shrink-0 transition-colors ${
                  pathname === "/about" ? "text-[#0D7E73]" : "text-slate-400 group-hover:text-[#0D7E73]"
                }`}
                strokeWidth={2}
              />
              <span className="text-sm">About Us</span>
            </div>
            <ArrowRight
              className={`w-4 h-4 transition-transform group-hover:translate-x-0.5 ${
                pathname === "/about" ? "text-[#0D7E73]" : "text-slate-300 group-hover:text-[#0D7E73]"
              }`}
            />
          </Link>

          {/* Item: Our Goals */}
          <Link
            href="/goals"
            onClick={() => setIsOpen(false)}
            className={`flex items-center justify-between px-3.5 py-3 rounded-xl transition-all duration-150 group cursor-pointer ${
              pathname === "/goals"
                ? "bg-[#E8F5F1] text-[#0D7E73] font-bold"
                : "text-slate-800 hover:bg-slate-50 font-medium"
            }`}
          >
            <div className="flex items-center gap-3">
              <Target
                className={`w-4.5 h-4.5 shrink-0 transition-colors ${
                  pathname === "/goals" ? "text-[#0D7E73]" : "text-slate-400 group-hover:text-[#0D7E73]"
                }`}
                strokeWidth={2}
              />
              <span className="text-sm">Our Goals</span>
            </div>
            <ArrowRight
              className={`w-4 h-4 transition-transform group-hover:translate-x-0.5 ${
                pathname === "/goals" ? "text-[#0D7E73]" : "text-slate-300 group-hover:text-[#0D7E73]"
              }`}
            />
          </Link>

          {/* Item: Our Mission & Vision */}
          <Link
            href="/mission"
            onClick={() => setIsOpen(false)}
            className={`flex items-center justify-between px-3.5 py-3 rounded-xl transition-all duration-150 group cursor-pointer ${
              pathname === "/mission"
                ? "bg-[#E8F5F1] text-[#0D7E73] font-bold"
                : "text-slate-800 hover:bg-slate-50 font-medium"
            }`}
          >
            <div className="flex items-center gap-3">
              <Compass
                className={`w-4.5 h-4.5 shrink-0 transition-colors ${
                  pathname === "/mission" ? "text-[#0D7E73]" : "text-slate-400 group-hover:text-[#0D7E73]"
                }`}
                strokeWidth={2}
              />
              <span className="text-sm">Our Mission & Vision</span>
            </div>
            <ArrowRight
              className={`w-4 h-4 transition-transform group-hover:translate-x-0.5 ${
                pathname === "/mission" ? "text-[#0D7E73]" : "text-slate-300 group-hover:text-[#0D7E73]"
              }`}
            />
          </Link>

          {/* Item: Contact Us */}
          <Link
            href="/contact"
            onClick={() => setIsOpen(false)}
            className={`flex items-center justify-between px-3.5 py-3 rounded-xl transition-all duration-150 group cursor-pointer ${
              pathname === "/contact"
                ? "bg-[#E8F5F1] text-[#0D7E73] font-bold"
                : "text-slate-800 hover:bg-slate-50 font-medium"
            }`}
          >
            <div className="flex items-center gap-3">
              <Mail
                className={`w-4.5 h-4.5 shrink-0 transition-colors ${
                  pathname === "/contact" ? "text-[#0D7E73]" : "text-slate-400 group-hover:text-[#0D7E73]"
                }`}
                strokeWidth={2}
              />
              <span className="text-sm">Contact Us</span>
            </div>
            <ArrowRight
              className={`w-4 h-4 transition-transform group-hover:translate-x-0.5 ${
                pathname === "/contact" ? "text-[#0D7E73]" : "text-slate-300 group-hover:text-[#0D7E73]"
              }`}
            />
          </Link>
        </div>

        {/* Drawer Footer: Portal Login */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 shrink-0">
          <Link
            href="/login"
            onClick={() => setIsOpen(false)}
            className="flex items-center justify-center gap-2.5 w-full py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
          >
            <LogIn className="w-4 h-4 text-slate-600" strokeWidth={2} />
            <span>Foundation Portal Login</span>
          </Link>
        </div>
      </aside>
    </>
  )
}
