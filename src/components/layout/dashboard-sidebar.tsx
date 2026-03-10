'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import {
  MessageSquare, UserCircle, LogOut, Users,
  Menu, X, Home, AlertCircle, Mail,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { MODULE_TIER_LABELS, type ModuleSlug, type ModuleTier } from '@/lib/modules'
import { PraeviusWordmark } from '@/components/ui/praevius-wordmark'
import { ModuleSwitcher } from '@/components/layout/module-switcher'

interface DashboardSidebarProps {
  subscribedModules: ModuleSlug[]
  memberName: string | null
  memberEmail: string
  memberTier: ModuleTier
}

export function DashboardSidebar({ subscribedModules, memberName, memberEmail, memberTier }: DashboardSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [pendingFriendCount, setPendingFriendCount] = useState(0)
  const friendsFetchedRef = useRef(false)

  // Fetch pending friend request count for mobile top bar
  useEffect(() => {
    if (friendsFetchedRef.current) return
    friendsFetchedRef.current = true
    fetch('/api/friends')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data?.friends) return
        const count = (data.friends as Array<{ direction: string; status: string }>)
          .filter(f => f.status === 'pending' && f.direction === 'received').length
        setPendingFriendCount(count)
      })
      .catch(() => {})
  }, [])

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

        {/* Module switcher — shared dropdown */}
        <ModuleSwitcher currentModule={null} onNavigate={() => setMobileOpen(false)} />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        {/* Dashboard */}
        <div>
          <p className="text-muted text-[10px] font-semibold uppercase tracking-widest px-3 pb-1">
            Home
          </p>
          <div className="space-y-0.5">
            <Link
              href="/home"
              onClick={() => setMobileOpen(false)}
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
              onClick={() => setMobileOpen(false)}
              className={cn('nav-link', pathname === '/home/friends' && 'nav-link-active')}
            >
              <Users className="h-4 w-4 flex-shrink-0" />
              Friends
            </Link>
            <Link
              href="/home/messages"
              onClick={() => setMobileOpen(false)}
              className={cn('nav-link', pathname === '/home/messages' && 'nav-link-active')}
            >
              <MessageSquare className="h-4 w-4 flex-shrink-0" />
              Messages
            </Link>
            <Link
              href="/home/profile"
              onClick={() => setMobileOpen(false)}
              className={cn('nav-link', pathname === '/home/profile' && 'nav-link-active')}
            >
              <UserCircle className="h-4 w-4 flex-shrink-0" />
              My Profile
            </Link>
            <Link
              href="/home/report-issue"
              onClick={() => setMobileOpen(false)}
              className={cn('nav-link', pathname === '/home/report-issue' && 'nav-link-active')}
            >
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              Report Issue
            </Link>
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
        <div className="flex items-center gap-1">
          <Link
            href="/home/friends"
            className="relative p-2.5 text-muted hover:text-primary transition-colors"
            aria-label="Friends"
          >
            <Users className="h-5 w-5" />
            {pendingFriendCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1">
                {pendingFriendCount > 9 ? '9+' : pendingFriendCount}
              </span>
            )}
          </Link>
          <Link
            href="/home/messages"
            className="p-2.5 text-muted hover:text-primary transition-colors"
            aria-label="Messages"
          >
            <Mail className="h-5 w-5" />
          </Link>
        </div>
      </div>

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
