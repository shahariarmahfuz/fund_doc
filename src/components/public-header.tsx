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
    <header className="fixed top-0 left-0 w-full z-50 px-4 sm:px-8 py-3.5 bg-white/75 backdrop-blur-md border-b border-slate-200/60 shadow-sm transition-all">
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
              <div className="w-full h-full rounded-full bg-teal-600 text-white font-bold flex items-center justify-center text-xs">
                BF
              </div>
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-sm sm:text-base font-bold text-slate-900 leading-tight tracking-tight">
              {branding.foundationName || "Brotherhood Foundation"}
            </span>
            <span className="text-xs font-semibold text-teal-700 leading-tight">
              Welfare Organization
            </span>
          </div>
        </Link>

        {/* 3-dot (⋮) Navigation Menu */}
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="p-2 sm:p-2.5 rounded-full bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-100/80 hover:text-teal-700 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                aria-label="More navigation options"
              >
                <MoreVertical className="w-5 h-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 bg-white/95 backdrop-blur-md border border-slate-200 shadow-xl rounded-2xl p-1.5 space-y-1 z-50">
              <DropdownMenuItem asChild className="hover:bg-slate-100/80 focus:bg-slate-100 rounded-xl text-slate-800 font-medium cursor-pointer p-2.5">
                <Link href="/" className="flex items-center gap-2.5">
                  <Home className="w-4 h-4 text-slate-600" />
                  <span>Home</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="hover:bg-slate-100/80 focus:bg-slate-100 rounded-xl text-slate-800 font-medium cursor-pointer p-2.5">
                <Link href="/about" className="flex items-center gap-2.5">
                  <Info className="w-4 h-4 text-teal-600" />
                  <span>About Us</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="hover:bg-slate-100/80 focus:bg-slate-100 rounded-xl text-slate-800 font-medium cursor-pointer p-2.5">
                <Link href="/goals" className="flex items-center gap-2.5">
                  <Target className="w-4 h-4 text-amber-600" />
                  <span>Our Goals</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="hover:bg-slate-100/80 focus:bg-slate-100 rounded-xl text-slate-800 font-medium cursor-pointer p-2.5">
                <Link href="/mission" className="flex items-center gap-2.5">
                  <Compass className="w-4 h-4 text-emerald-600" />
                  <span>Our Mission / Vision</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="hover:bg-slate-100/80 focus:bg-slate-100 rounded-xl text-slate-800 font-medium cursor-pointer p-2.5">
                <Link href="/contact" className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-sky-600" />
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
