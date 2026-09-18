"use client"

import { User, LogOut, Settings, KeyRound, Menu, HelpCircle } from "lucide-react"
import { useSession, signOut } from "next-auth/react"
import { useSidebar } from "@/components/layout/sidebar-provider"
import { usePathname } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"

import { useBranding } from "@/components/providers/branding-provider"

export function Header() {
  const { data: session } = useSession()
  const { toggleSidebar } = useSidebar()
  const pathname = usePathname()
  const branding = useBranding()

  const getPageTitle = () => {
    if (pathname === '/') return 'Dashboard'
    const path = pathname.split('/')[1]
    
    const titles: Record<string, string> = {
      'members': 'Members',
      'beneficiaries': 'Beneficiaries',
      'donors': 'Donors',
      'loans': 'Qard Hasan',
      'grants': 'Sadaqah',
      'expenses': 'Expenses',
      'groups': 'Groups',
      'settings': 'Settings',
      'profile': 'Settings'
    }
    
    return path && titles[path] ? titles[path] : (path ? path.charAt(0).toUpperCase() + path.slice(1) : 'Dashboard')
  }

  return (
    <header className="h-14 bg-surface-0/80 backdrop-blur-md border-b border-surface-200 flex items-center justify-between px-4 lg:px-6 shrink-0 z-40 sticky top-0 w-full animate-fade-in">
      <div className="flex items-center gap-3">
        <button 
          className="p-2 -ml-2 text-surface-500 hover:text-surface-700 hover:bg-surface-100 rounded-lg transition-colors flex items-center justify-center" 
          onClick={toggleSidebar}
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        
        {branding.headerLogo && (
          <img src={branding.headerLogo} alt="Logo" className="h-6 w-auto object-contain hidden sm:block" />
        )}
        <h1 className="text-[15px] font-bold text-surface-950 tracking-tight leading-tight capitalize ml-2">{getPageTitle()}</h1>
      </div>

      <div className="flex items-center gap-1">

        <button className="tooltip-container p-2 text-surface-500 hover:text-surface-700 hover:bg-surface-100 rounded-lg transition-all hidden sm:flex">
          <HelpCircle className="w-5 h-5" />
          <span className="tooltip-custom">Help Center</span>
        </button>

        <div className="w-px h-6 bg-surface-200 mx-2 hidden sm:block"></div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="rounded-full outline-none focus:ring-2 focus:ring-slate-300 transition-all hover:opacity-85">
              <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-[11px] font-bold shadow-sm overflow-hidden border border-slate-200">
                {session?.user?.image ? (
                  <img 
                    src={session.user.image} 
                    alt={session.user.name || "User"} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      if (e.currentTarget.parentElement) {
                        e.currentTarget.parentElement.innerHTML = session?.user?.name ? session.user.name.substring(0, 2).toUpperCase() : 'EX';
                      }
                    }}
                  />
                ) : (
                  session?.user?.name ? session.user.name.substring(0, 2).toUpperCase() : 'EX'
                )}
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-surface-0 border border-surface-200 shadow-lg">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-[13px] font-semibold text-surface-900 leading-none">{session?.user?.name || "Executive"}</p>
                <p className="text-[11px] leading-none text-surface-500 mt-1">{session?.user?.email || "admin@foundation.org"}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-surface-200" />
            <DropdownMenuItem asChild className="hover:bg-surface-50 text-[13px] font-medium text-surface-700 cursor-pointer">
              <Link href="/profile">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="hover:bg-surface-50 text-[13px] font-medium text-surface-700 cursor-pointer">
              <Link href="/settings">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="hover:bg-surface-50 text-[13px] font-medium text-surface-700 cursor-pointer">
              <Link href="/profile/password">
                <KeyRound className="mr-2 h-4 w-4" />
                <span>Change Password</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-surface-200" />
            <DropdownMenuItem onClick={() => {
                        return (signOut({ callbackUrl: window.location.origin + '/login' }));
                      }} className="hover:bg-accent-red/10 focus:bg-accent-red/10 text-accent-red focus:text-accent-red text-[13px] font-medium cursor-pointer transition-colors">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

      </div>
    </header>
  )
}
