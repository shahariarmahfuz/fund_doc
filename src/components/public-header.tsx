"use client"

import Link from "next/link"
import { MoreVertical, Info, Target, Compass, Mail, Home } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useBranding } from "@/components/providers/branding-provider"

export function PublicHeader() {
  const branding = useBranding()

  return (
    <header className="fixed top-0 left-0 w-full z-50 px-4 sm:px-8 py-3 bg-white/80 backdrop-blur-md border-b border-slate-200/70 shadow-sm transition-all">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group hover:opacity-85 transition-opacity">
          <div className="w-9 h-9 sm:w-10 sm:h-10 drop-shadow-sm flex items-center justify-center shrink-0">
            {branding.loginLogo || branding.logo || branding.headerLogo ? (
              <img
                src={branding.loginLogo || branding.logo || branding.headerLogo!}
                alt="Foundation Logo"
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 text-white font-extrabold flex items-center justify-center text-xs shadow-inner">
                BF
              </div>
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-sm sm:text-base font-extrabold text-slate-900 leading-tight tracking-tight">
              {branding.foundationName || "Brotherhood Foundation"}
            </span>
            <span className="text-[11px] sm:text-xs font-semibold text-teal-700 leading-tight">
              Welfare Organization
            </span>
          </div>
        </Link>

        {/* Premium 3-dot (⋮) Navigation Menu */}
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="w-10 h-10 sm:w-10 sm:h-10 rounded-full bg-slate-50 hover:bg-slate-100/90 border border-slate-200/90 text-slate-700 hover:text-teal-700 flex items-center justify-center transition-all duration-200 shadow-sm active:scale-95 focus:outline-none focus:ring-2 focus:ring-teal-500/40"
                aria-label="More navigation options"
              >
                <MoreVertical className="w-5 h-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              sideOffset={8}
              className="w-56 bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-[0_20px_50px_-10px_rgba(15,23,42,0.15)] rounded-2xl p-2 space-y-1 z-50 animate-in fade-in-0 zoom-in-95 duration-150"
            >
              <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1">
                Navigation
              </div>
              <DropdownMenuItem asChild className="hover:bg-slate-100/80 focus:bg-slate-100 rounded-xl text-slate-800 font-semibold text-[13px] cursor-pointer py-2.5 px-3 transition-colors">
                <Link href="/" className="flex items-center gap-3">
                  <div className="p-1.5 bg-slate-100 text-slate-600 rounded-lg">
                    <Home className="w-4 h-4" />
                  </div>
                  <span>Home</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="hover:bg-teal-50 focus:bg-teal-50 rounded-xl text-slate-800 font-semibold text-[13px] cursor-pointer py-2.5 px-3 transition-colors">
                <Link href="/about" className="flex items-center gap-3">
                  <div className="p-1.5 bg-teal-100/80 text-teal-700 rounded-lg">
                    <Info className="w-4 h-4" />
                  </div>
                  <span>About Us</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="hover:bg-amber-50 focus:bg-amber-50 rounded-xl text-slate-800 font-semibold text-[13px] cursor-pointer py-2.5 px-3 transition-colors">
                <Link href="/goals" className="flex items-center gap-3">
                  <div className="p-1.5 bg-amber-100/80 text-amber-700 rounded-lg">
                    <Target className="w-4 h-4" />
                  </div>
                  <span>Our Goals</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="hover:bg-emerald-50 focus:bg-emerald-50 rounded-xl text-slate-800 font-semibold text-[13px] cursor-pointer py-2.5 px-3 transition-colors">
                <Link href="/mission" className="flex items-center gap-3">
                  <div className="p-1.5 bg-emerald-100/80 text-emerald-700 rounded-lg">
                    <Compass className="w-4 h-4" />
                  </div>
                  <span>Our Mission / Vision</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="hover:bg-sky-50 focus:bg-sky-50 rounded-xl text-slate-800 font-semibold text-[13px] cursor-pointer py-2.5 px-3 transition-colors">
                <Link href="/contact" className="flex items-center gap-3">
                  <div className="p-1.5 bg-sky-100/80 text-sky-700 rounded-lg">
                    <Mail className="w-4 h-4" />
                  </div>
                  <span>Contact Us</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
