'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  MessageSquare, UserCircle, Users,
  Home, AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { type ModuleSlug, type ModuleTier } from '@/lib/modules'
import { ModuleSwitcher } from '@/components/layout/module-switcher'
import { SidebarShell } from '@/components/layout/sidebar-shell'
import { SidebarFooter } from '@/components/layout/sidebar-footer'
import { SidebarDrawerHeader } from '@/components/layout/sidebar-drawer-header'

interface DashboardSidebarProps {
  subscribedModules: ModuleSlug[]
  memberName: string | null
  memberEmail: string
  memberTier: ModuleTier
}

export function DashboardSidebar({ memberName, memberEmail, memberTier }: DashboardSidebarProps) {
  const pathname = usePathname()

  return (
    <SidebarShell
      messagesHref="/home/messages"
      renderContent={(closeMobile) => (
        <>
          <div className="px-4 pt-4 pb-3 border-b border-subtle">
            <SidebarDrawerHeader onClose={closeMobile} />
            <ModuleSwitcher currentModule={null} onNavigate={closeMobile} />
          </div>

          <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
            {/* Dashboard */}
            <div>
              <p className="text-muted text-[10px] font-semibold uppercase tracking-widest px-3 pb-1">
                Home
              </p>
              <div className="space-y-0.5">
                <Link
                  href="/home"
                  onClick={closeMobile}
                  className={cn('nav-link', pathname === '/home' && 'nav-link-active')}
                >
                  <Home className="h-4 w-4 flex-shrink-0" />
                  Overview
                </Link>
              </div>
            </div>

            {/* Social */}
            <div>
              <div className="pt-2 mt-2 border-t border-subtle" />
              <div className="space-y-0.5">
                <Link
                  href="/home/friends"
                  onClick={closeMobile}
                  className={cn('nav-link', pathname === '/home/friends' && 'nav-link-active')}
                >
                  <Users className="h-4 w-4 flex-shrink-0" />
                  Friends
                </Link>
                <Link
                  href="/home/messages"
                  onClick={closeMobile}
                  className={cn('nav-link', pathname === '/home/messages' && 'nav-link-active')}
                >
                  <MessageSquare className="h-4 w-4 flex-shrink-0" />
                  Messages
                </Link>
                <Link
                  href="/home/profile"
                  onClick={closeMobile}
                  className={cn('nav-link', pathname === '/home/profile' && 'nav-link-active')}
                >
                  <UserCircle className="h-4 w-4 flex-shrink-0" />
                  My Profile
                </Link>
                <Link
                  href="/home/report-issue"
                  onClick={closeMobile}
                  className={cn('nav-link', pathname === '/home/report-issue' && 'nav-link-active')}
                >
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  Report Issue
                </Link>
              </div>
            </div>
          </nav>

          <SidebarFooter memberName={memberName} memberEmail={memberEmail} memberTier={memberTier} />
        </>
      )}
    />
  )
}
