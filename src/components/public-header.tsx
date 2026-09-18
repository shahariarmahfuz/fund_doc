"use client"

import Link from "next/link"
import { MoreVertical, Info, Target, Compass, Mail } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function PublicHeader() {
  return (
    <header className="absolute top-0 left-0 w-full z-50 p-4 sm:p-6 flex items-center justify-between">
      <Link href="/" className="flex items-center gap-2 sm:gap-3 group hover:opacity-80 transition-opacity">
        <div className="w-10 h-10 sm:w-12 sm:h-12 drop-shadow-md">
          <img 
            src="https://res.cloudinary.com/diwp8ug1r/image/upload/v1785393014/branding/o4r9o3gjgfkulrgm4bzu.png?v=1785394871157" 
            alt="Foundation Logo"
            className="w-full h-full object-contain"
          />
        </div>
        <div className="flex flex-col">
          <span className="text-sm sm:text-base font-bold text-slate-900 leading-tight tracking-tight">
            Brotherhood Foundation
          </span>
          <span className="text-xs sm:text-sm font-semibold text-teal-700 leading-tight">
            Welfare Organization
          </span>
        </div>
      </Link>

      {/* 3-dot (⋮) Navigation Menu */}
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="p-2.5 rounded-full bg-white/80 border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-teal-700 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              aria-label="More navigation options"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-white/95 backdrop-blur-md border border-slate-200 shadow-xl rounded-2xl p-1.5 space-y-1">
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
    </header>
  )
}
