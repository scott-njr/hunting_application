'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Bot, Users, Calendar, UserCircle,
  ClipboardList, Package, MapPin, GraduationCap,
  MessageSquare, Route, ClipboardCheck, Activity,
  UtensilsCrossed, Sparkles, AlertCircle, Trophy,
  LayoutDashboard, Tent, Dumbbell,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { type ModuleSlug, type ModuleTier } from '@/lib/modules'
import { ModuleSwitcher } from '@/components/layout/module-switcher'
import { SidebarShell } from '@/components/layout/sidebar-shell'
import { SidebarFooter } from '@/components/layout/sidebar-footer'
import { SidebarDrawerHeader } from '@/components/layout/sidebar-drawer-header'
import { useAuthCached } from '@/lib/use-auth-cached'
import { useUnreadMessageCount } from '@/hooks/use-unread-message-count'

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
    { label: 'Tools', items: [
      { href: '/firearms/shot-timer', label: 'Shot Timer', icon: Activity },
      { href: '/firearms/matches', label: 'Matches', icon: Trophy },
    ] },
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
  const { user } = useAuthCached()
  const unreadMessages = useUnreadMessageCount(user?.id)
  const navSections = MODULE_NAV[moduleSlug] ?? []

  return (
    <SidebarShell
      renderContent={(closeMobile) => (
        <>
          <div className="px-4 pt-4 pb-3 border-b border-subtle">
            <SidebarDrawerHeader onClose={closeMobile} />
            <ModuleSwitcher currentModule={moduleSlug} onNavigate={closeMobile} />
          </div>

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
                          onClick={closeMobile}
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
                              const showMessageBadge = child.label === 'Messages' && unreadMessages > 0
                              return (
                                <Link
                                  key={child.href}
                                  href={child.href}
                                  onClick={closeMobile}
                                  className={cn(
                                    'nav-link text-xs',
                                    childActive && 'nav-link-active'
                                  )}
                                >
                                  <ChildIcon className="h-3.5 w-3.5 flex-shrink-0" />
                                  {child.label}
                                  {showMessageBadge && (
                                    <span className="ml-auto min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1">
                                      {unreadMessages > 9 ? '9+' : unreadMessages}
                                    </span>
                                  )}
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

          <SidebarFooter memberName={memberName} memberEmail={memberEmail} memberTier={moduleTier} />
        </>
      )}
    />
  )
}
