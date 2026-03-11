'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  Bot, Users, Calendar, LogOut, UserCircle,
  ClipboardList, Package, MapPin, GraduationCap,
  MessageSquare, X, Route, ClipboardCheck, Activity,
  UtensilsCrossed, Sparkles, AlertCircle, Trophy,
  LayoutDashboard, Tent, Dumbbell,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { type ModuleSlug, type ModuleTier, MODULE_TIER_LABELS, MODULE_TIER_COLORS } from '@/lib/modules'
import { PraeviusWordmark } from '@/components/ui/praevius-wordmark'
import { ModuleSwitcher } from '@/components/layout/module-switcher'
import { MobileTopBar } from '@/components/layout/mobile-top-bar'

type NavItem = {
  href: string
  label: string
  icon: React.ElementType
  exact?: boolean
  ai?: boolean
  children?: NavItem[]
}

type NavSection = {
  label: string | null
  items: NavItem[]
}

const MODULE_NAV: Record<ModuleSlug, NavSection[]> = {
  hunting: [
    {
      label: null,
      items: [
        { href: '/hunting/my-hunts', label: 'My Hunting', icon: LayoutDashboard, exact: true },
      ],
    },
    {
      label: 'Tools',
      items: [
        { href: '/hunting/deadlines',    label: 'Deadlines',    icon: Calendar },
        { href: '/hunting/ai-assistant', label: 'Draw Research',  icon: Bot, ai: true },
        { href: '/hunting/applications', label: 'Applications', icon: ClipboardList },
        { href: '/hunting/hunts',        label: 'Hunt Planner', icon: Tent, ai: true },
        { href: '/hunting/field-map',     label: 'Field Map',    icon: MapPin },
        { href: '/hunting/gear',         label: 'Gear',         icon: Package },
      ],
    },
    {
      label: 'Learn',
      items: [
        { href: '/hunting/courses', label: 'Courses', icon: GraduationCap },
      ],
    },
    {
      label: null,
      items: [
        { href: '/hunting/community', label: 'Community', icon: Users, exact: true, children: [
          { href: '/hunting/community/messages', label: 'Messages', icon: MessageSquare },
        ]},
        { href: '/hunting/report-issue', label: 'Report Issue', icon: AlertCircle },
        { href: '/hunting/profile',   label: 'My Profile', icon: UserCircle },
      ],
    },
  ],
  archery: [
    {
      label: null,
      items: [
        { href: '/archery/my-archery', label: 'My Archery', icon: LayoutDashboard, exact: true },
      ],
    },
    {
      label: 'Learn',
      items: [
        { href: '/archery/courses', label: 'Courses', icon: GraduationCap },
      ],
    },
    {
      label: null,
      items: [
        { href: '/archery/community', label: 'Community', icon: Users, exact: true, children: [
          { href: '/archery/community/messages', label: 'Messages', icon: MessageSquare },
        ]},
        { href: '/archery/report-issue', label: 'Report Issue', icon: AlertCircle },
        { href: '/archery/profile', label: 'My Profile', icon: UserCircle },
      ],
    },
  ],
  firearms: [
    { label: null, items: [{ href: '/firearms/my-firearms', label: 'My Firearms', icon: LayoutDashboard, exact: true }] },
    { label: 'Learn', items: [{ href: '/firearms/courses', label: 'Courses', icon: GraduationCap }] },
    { label: null, items: [
      { href: '/firearms/community', label: 'Community', icon: Users, exact: true, children: [
        { href: '/firearms/community/messages', label: 'Messages', icon: MessageSquare },
      ]},
      { href: '/firearms/report-issue', label: 'Report Issue', icon: AlertCircle },
      { href: '/firearms/profile', label: 'My Profile', icon: UserCircle },
    ]},
  ],
  medical: [
    { label: null, items: [{ href: '/medical/my-medical', label: 'My Medical', icon: LayoutDashboard, exact: true }] },
    { label: 'Learn', items: [{ href: '/medical/courses', label: 'Courses', icon: GraduationCap }] },
    { label: null, items: [
      { href: '/medical/community', label: 'Community', icon: Users, exact: true, children: [
        { href: '/medical/community/messages', label: 'Messages', icon: MessageSquare },
      ]},
      { href: '/medical/report-issue', label: 'Report Issue', icon: AlertCircle },
      { href: '/medical/profile', label: 'My Profile', icon: UserCircle },
    ]},
  ],
  fishing: [
    { label: null, items: [{ href: '/fishing/my-fishing', label: 'My Fishing', icon: LayoutDashboard, exact: true }] },
    { label: 'Learn', items: [{ href: '/fishing/courses', label: 'Courses', icon: GraduationCap }] },
    { label: null, items: [
      { href: '/fishing/community', label: 'Community', icon: Users, exact: true, children: [
        { href: '/fishing/community/messages', label: 'Messages', icon: MessageSquare },
      ]},
      { href: '/fishing/report-issue', label: 'Report Issue', icon: AlertCircle },
      { href: '/fishing/profile', label: 'My Profile', icon: UserCircle },
    ]},
  ],
  fitness: [
    { label: null, items: [
      { href: '/fitness/my-plan', label: 'My Fitness', icon: LayoutDashboard, exact: true },
    ]},
    { label: 'Train', items: [
      { href: '/fitness/weekly-challenge', label: 'Weekly Challenge', icon: Route },
      { href: '/fitness/baseline', label: 'Baseline Test', icon: ClipboardCheck },
      { href: '/fitness/run-coach', label: 'Run Coach', icon: Activity, ai: true },
      { href: '/fitness/strength-coach', label: 'Strength Coach', icon: Dumbbell, ai: true },
      { href: '/fitness/meal-prep', label: 'Meal Prep', icon: UtensilsCrossed, ai: true },
      { href: '/fitness/coach', label: 'AI Coach', icon: Bot, ai: true },
    ]},
    { label: 'Learn', items: [{ href: '/fitness/courses', label: 'Courses', icon: GraduationCap }] },
    { label: null, items: [
      { href: '/fitness/community', label: 'Community', icon: Users, exact: true, children: [
        { href: '/fitness/community/leaderboard', label: 'Leaderboard', icon: Trophy },
        { href: '/fitness/community/messages', label: 'Messages', icon: MessageSquare },
      ]},
      { href: '/fitness/report-issue', label: 'Report Issue', icon: AlertCircle },
      { href: '/fitness/profile', label: 'My Profile', icon: UserCircle },
    ]},
  ],
}

interface ModuleSidebarProps {
  moduleSlug: ModuleSlug
  moduleTier: ModuleTier
  memberName: string | null
  memberEmail: string
}

export function ModuleSidebar({ moduleSlug, moduleTier, memberName, memberEmail }: ModuleSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const navSections = MODULE_NAV[moduleSlug] ?? []
  const [mobileOpen, setMobileOpen] = useState(false)

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false)
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

  const sidebarContent = (
    <>
      <div className="px-4 pt-4 pb-3 border-b border-subtle">
        {/* Close button — mobile only */}
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

        {/* Module switcher — shared dropdown */}
        <ModuleSwitcher currentModule={moduleSlug} onNavigate={() => setMobileOpen(false)} />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        {navSections.map((section, sIdx) => (
          <div key={sIdx}>
            {section.label && (
              <p className={cn(
                'text-muted text-[10px] font-semibold uppercase tracking-widest px-3 pb-1',
                sIdx > 0 && 'pt-3 mt-2 border-t border-subtle'
              )}>
                {section.label}
              </p>
            )}
            {!section.label && sIdx > 0 && (
              <div className="pt-2 mt-2 border-t border-subtle" />
            )}
            <div className="space-y-0.5">
              {section.items.map(({ href, label, icon: Icon, exact, ai, children }) => {
                const isActive = exact ? pathname === href : pathname.startsWith(href)
                const isParentActive = children && pathname.startsWith(href)
                return (
                  <div key={href}>
                    <Link
                      href={href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        'nav-link',
                        (isActive || isParentActive) && 'nav-link-active'
                      )}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      {label}
                      {ai && <Sparkles className="h-3 w-3 ml-auto text-emerald-400/80 flex-shrink-0" />}
                    </Link>
                    {children && isParentActive && (
                      <div className="ml-4 pl-3 border-l border-subtle space-y-0.5 mt-0.5">
                        {children.map(child => {
                          const childActive = child.exact ? pathname === child.href : pathname.startsWith(child.href)
                          const ChildIcon = child.icon
                          return (
                            <Link
                              key={child.href}
                              href={child.href}
                              onClick={() => setMobileOpen(false)}
                              className={cn(
                                'nav-link text-xs',
                                childActive && 'nav-link-active'
                              )}
                            >
                              <ChildIcon className="h-3.5 w-3.5 flex-shrink-0" />
                              {child.label}
                            </Link>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Member info */}
      <div className="px-4 py-4 border-t border-subtle">
        <div className="flex items-start justify-between mb-3">
          <div className="min-w-0">
            <p className="text-primary text-sm font-medium truncate">{memberName ?? 'Member'}</p>
            <p className="text-muted text-xs truncate">{memberEmail}</p>
          </div>
          <span className={cn('ml-2 px-2 py-0.5 rounded text-xs font-semibold uppercase shrink-0', MODULE_TIER_COLORS[moduleTier])}>
            {MODULE_TIER_LABELS[moduleTier]}
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
      <MobileTopBar onMenuOpen={() => setMobileOpen(true)} messagesHref={`/${moduleSlug}/community/messages`} />

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
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
