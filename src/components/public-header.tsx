"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  Menu,
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
  Shield,
} from "lucide-react"
import { useBranding } from "@/components/providers/branding-provider"

export function PublicHeader() {
  const [isOpen, setIsOpen] = useState(false)
  const branding = useBranding()

  // Close drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false)
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Prevent background scroll when mobile menu is open
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

  return (
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
                alt="Brotherhood Foundation"
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full rounded-2xl bg-gradient-to-br from-[#0D7E73] to-[#0A625A] text-white font-extrabold flex items-center justify-center text-xs shadow-inner">
                BF
              </div>
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-[15px] sm:text-base font-extrabold text-[#0F172A] leading-tight tracking-tight">
              {branding.foundationName || "Brotherhood Foundation"}
            </span>
            <span className="text-[11px] sm:text-xs font-semibold text-[#0D7E73] leading-tight">
              Welfare Organization
            </span>
          </div>
        </Link>

        {/* Large Rounded-Square Hamburger Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-11 h-11 rounded-2xl bg-[#E8F5F1] hover:bg-[#D8EFE8] active:bg-[#CCEAE2] border border-[#C6E9E0] text-[#0D7E73] flex items-center justify-center transition-all duration-200 shadow-2xs active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#0D7E73]/30 cursor-pointer"
          aria-label="Toggle navigation menu"
          aria-expanded={isOpen}
        >
          {isOpen ? (
            <X className="w-5 h-5" strokeWidth={2.4} />
          ) : (
            <Menu className="w-5 h-5" strokeWidth={2.4} />
          )}
        </button>
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-slate-900/35 backdrop-blur-xs z-50 transition-opacity duration-200"
          aria-hidden="true"
        />
      )}

      {/* Slide-Down / Dropdown Navigation Drawer */}
      {isOpen && (
        <div
          role="menu"
          className="fixed top-3 right-3 sm:right-6 w-[calc(100vw-24px)] max-w-sm bg-white/98 backdrop-blur-2xl rounded-3xl p-5 shadow-[0_25px_60px_-15px_rgba(15,23,42,0.22)] border border-slate-100 z-50 space-y-4 animate-in fade-in-0 zoom-in-95 duration-150"
        >
          {/* Drawer Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#E8F5F1] text-[#0D7E73] flex items-center justify-center font-bold text-xs">
                BF
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-sm text-[#0F172A] leading-tight">
                  Brotherhood Foundation
                </span>
                <span className="text-[10px] font-semibold text-[#0D7E73] uppercase tracking-wider">
                  Public Navigation
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close navigation menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1">
            <Link
              href="/"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 text-slate-800 font-semibold text-sm transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 text-slate-700 rounded-xl group-hover:bg-[#E8F5F1] group-hover:text-[#0D7E73] transition-colors">
                  <Home className="w-4 h-4" />
                </div>
                <span>Home</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#0D7E73] group-hover:translate-x-0.5 transition-all" />
            </Link>

            <Link
              href="/member-request"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between p-2.5 rounded-2xl bg-[#E8F5F1]/50 hover:bg-[#E8F5F1] text-[#0D7E73] font-bold text-sm transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#E8F5F1] text-[#0D7E73] rounded-xl">
                  <UserPlus className="w-4 h-4" />
                </div>
                <span>Become a Member</span>
              </div>
              <ArrowRight className="w-4 h-4 text-[#0D7E73] group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <Link
              href="/member-request/status"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-teal-50 text-slate-800 font-semibold text-sm transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#E8F5F1] text-[#0D7E73] rounded-xl">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <span>Check Application Status</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#0D7E73] group-hover:translate-x-0.5 transition-all" />
            </Link>

            <div className="py-1">
              <div className="h-px bg-slate-100" />
            </div>

            <Link
              href="/about"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 text-slate-800 font-semibold text-sm transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#E8F5F1] text-[#0D7E73] rounded-xl">
                  <Info className="w-4 h-4" />
                </div>
                <span>About Us</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#0D7E73] group-hover:translate-x-0.5 transition-all" />
            </Link>

            <Link
              href="/goals"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-amber-50/50 text-slate-800 font-semibold text-sm transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#FEF3C7] text-[#D97706] rounded-xl">
                  <Target className="w-4 h-4" />
                </div>
                <span>Our Goals</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#D97706] group-hover:translate-x-0.5 transition-all" />
            </Link>

            <Link
              href="/mission"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-emerald-50/50 text-slate-800 font-semibold text-sm transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#DCFCE7] text-[#16A34A] rounded-xl">
                  <Compass className="w-4 h-4" />
                </div>
                <span>Our Mission & Vision</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#16A34A] group-hover:translate-x-0.5 transition-all" />
            </Link>

            <Link
              href="/contact"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-sky-50/50 text-slate-800 font-semibold text-sm transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#E0F2FE] text-[#0284C7] rounded-xl">
                  <Mail className="w-4 h-4" />
                </div>
                <span>Contact Us</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#0284C7] group-hover:translate-x-0.5 transition-all" />
            </Link>
          </nav>

          {/* Portal Login Footer in Drawer */}
          <div className="pt-2 border-t border-slate-100">
            <Link
              href="/login"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Foundation Portal Login</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
