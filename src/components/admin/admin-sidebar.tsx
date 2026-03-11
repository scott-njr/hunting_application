'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCallback } from 'react'
import {
  LayoutDashboard, Users, AlertCircle, Activity, MessageSquare, FileText, Rocket, Shield,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { type ModuleTier } from '@/lib/modules'
import { SidebarShell } from '@/components/layout/sidebar-shell'
import { SidebarFooter } from '@/components/layout/sidebar-footer'
import { SidebarDrawerHeader } from '@/components/layout/sidebar-drawer-header'
import { ModuleSwitcher } from '@/components/layout/module-switcher'

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/issues', label: 'Issues', icon: AlertCircle },
  { href: '/admin/deploys', label: 'Deploys', icon: Rocket },
  { href: '/admin/ai-usage', label: 'AI Usage', icon: Activity },
  { href: '/admin/ai-logs', label: 'AI Logs', icon: FileText },
  { href: '/admin/community', label: 'Community', icon: MessageSquare },
]

interface AdminSidebarProps {
  memberName: string | null
  memberEmail: string
  memberTier: ModuleTier
}

export function AdminSidebar({ memberName, memberEmail, memberTier }: AdminSidebarProps) {
  const pathname = usePathname()

  const handleRouteChange = useCallback(() => {}, [])

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <SidebarShell
      onRouteChange={handleRouteChange}
      renderContent={(closeMobile) => (
        <>
          <div className="px-4 pt-4 pb-3 border-b border-subtle">
            <SidebarDrawerHeader onClose={closeMobile} />
            <ModuleSwitcher currentModule={null} onNavigate={closeMobile} label="Admin Panel" icon={Shield} />
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
            <div>
              <p className="text-muted text-[10px] font-semibold uppercase tracking-widest px-3 pb-1">
                Admin
              </p>
              <div className="space-y-0.5">
                {NAV_ITEMS.map(item => {
                  const Icon = item.icon
                  const active = isActive(item.href, item.exact)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={closeMobile}
                      className={cn('nav-link', active && 'nav-link-active')}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            </div>
          </nav>

          <SidebarFooter memberName={memberName} memberEmail={memberEmail} memberTier={memberTier} />
        </>
      )}
    />
  )
}
