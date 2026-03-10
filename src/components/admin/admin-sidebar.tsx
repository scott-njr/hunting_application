'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import {
  LayoutDashboard, Users, AlertCircle, Activity, MessageSquare, FileText, Rocket,
  Menu, X, LogOut, ChevronDown, LayoutGrid, Home, Shield,
  Crosshair, Target, Heart, Fish, Dumbbell,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { ALL_MODULES, MODULE_TIER_LABELS, type ModuleSlug, type ModuleTier } from '@/lib/modules'
import { PraeviusWordmark } from '@/components/ui/praevius-wordmark'

const MODULE_ICONS: Record<ModuleSlug, React.ElementType> = {
  hunting: Crosshair,
  archery: Target,
  firearms: Shield,
  medical: Heart,
  fishing: Fish,
  fitness: Dumbbell,
}

const MODULE_ENTRY: Record<ModuleSlug, string> = {
  hunting: '/hunting/deadlines',
  archery: '/archery/courses',
  firearms: '/firearms/courses',
  medical: '/medical/courses',
  fishing: '/fishing/courses',
  fitness: '/fitness/weekly-challenge',
}

const MODULE_NAMES: Record<ModuleSlug, string> = {
  hunting: 'Hunting',
  archery: 'Archery',
  firearms: 'Firearms',
  medical: 'Medical',
  fishing: 'Fishing',
  fitness: 'Fitness',
}

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
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [moduleDropdownOpen, setModuleDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setModuleDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false)
    setModuleDropdownOpen(false)
  }, [pathname])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.refresh()
    router.push('/')
  }

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href
    return pathname === href || pathname.startsWith(href + '/')
  }

  const sidebarContent = (
    <>
      <div className="px-4 pt-4 pb-3 border-b border-subtle">
        {/* Close button + logo — mobile only */}
        <div className="lg:hidden mb-3 flex items-center justify-between">
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <PraeviusWordmark size="sm" />
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="p-2.5 text-muted hover:text-primary transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Admin Panel dropdown — switch to modules or command center */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setModuleDropdownOpen(v => !v)}
            className="flex items-center justify-between w-full bg-elevated border border-default rounded px-3 py-2 transition-colors group"
          >
            <div className="flex items-center gap-2">
              <Shield className="h-3.5 w-3.5 text-accent-hover" />
              <span className="text-primary text-sm font-medium">Admin Panel</span>
            </div>
            <div className="flex items-center gap-1 text-muted group-hover:text-secondary transition-colors">
              <LayoutGrid className="h-3 w-3" />
              <ChevronDown className={cn('h-3 w-3 transition-transform', moduleDropdownOpen && 'rotate-180')} />
            </div>
          </button>

          {moduleDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-default rounded-lg shadow-xl z-50 overflow-hidden">
              <div className="px-3 pt-2 pb-1">
                <p className="text-muted text-xs uppercase tracking-wide font-medium">Navigate</p>
              </div>
              <button
                type="button"
                onClick={() => { setModuleDropdownOpen(false); router.push('/home') }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-secondary hover:bg-elevated hover:text-primary transition-colors"
              >
                <Home className="h-3.5 w-3.5" />
                <span>Command Center</span>
              </button>
              <div className="border-t border-subtle my-1" />
              <div className="px-3 pt-1 pb-1">
                <p className="text-muted text-xs uppercase tracking-wide font-medium">Modules</p>
              </div>
              {ALL_MODULES.map(mod => {
                const Icon = MODULE_ICONS[mod.slug as ModuleSlug]
                const href = MODULE_ENTRY[mod.slug as ModuleSlug]
                return (
                  <button
                    key={mod.slug}
                    type="button"
                    onClick={() => { setModuleDropdownOpen(false); router.push(href) }}
                    className={cn(
                      'w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors',
                      mod.isActive
                        ? 'text-secondary hover:bg-elevated hover:text-primary'
                        : 'text-muted cursor-default'
                    )}
                    disabled={!mod.isActive}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{MODULE_NAMES[mod.slug as ModuleSlug]}</span>
                    {!mod.isActive && (
                      <span className="text-xs text-muted bg-elevated rounded px-1">soon</span>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>
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

      {/* Member info */}
      <div className="px-4 py-4 border-t border-subtle">
        <div className="flex items-start justify-between mb-3">
          <div className="min-w-0">
            <p className="text-primary text-sm font-medium truncate">{memberName ?? 'Member'}</p>
            <p className="text-muted text-xs truncate">{memberEmail}</p>
          </div>
          <span className={cn('ml-2 px-2 py-0.5 rounded text-xs font-semibold uppercase shrink-0', `tier-${memberTier}`)}>
            {MODULE_TIER_LABELS[memberTier]}
          </span>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 text-muted hover:text-primary text-xs transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-surface border-b border-subtle px-4 py-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="p-2.5 text-muted hover:text-primary transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>
        <PraeviusWordmark size="sm" />
        <div className="w-10" /> {/* Spacer for centering */}
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          'lg:hidden sidebar-surface flex flex-col h-dvh z-50 fixed inset-y-0 left-0 w-72',
          mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        )}
        style={{ transition: 'transform 0.2s ease-in-out' }}
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:sticky lg:top-0 lg:shrink-0 sidebar-surface flex-col lg:h-[calc(100dvh-3rem)]">
        {sidebarContent}
      </aside>
    </>
  )
}
