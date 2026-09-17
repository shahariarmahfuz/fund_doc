"use client"

import Link from "next/link"

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
    </header>
  )
}
