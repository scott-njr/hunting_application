'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ChevronDown, LogOut, CreditCard, User, LayoutGrid,
  Phone, Mail, KeyRound, Shield,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { MODULE_TIER_RANK, MODULE_TIER_LABELS, type ModuleTier } from '@/lib/modules'

interface Profile {
  display_name: string | null
  phone: string | null
  residency_state: string | null
  avatar_url: string | null
}

type TierInfo = { highestTier: ModuleTier; is_admin: boolean } | null

// Cache profile + tier across mounts so navigations don't flash
let cachedProfile: Profile | null = null
let cachedTier: TierInfo = null
let cacheUserId: string | null = null

interface AccountDropdownProps {
  userId: string
  email: string
  onSignOut: () => void
}

export function AccountDropdown({ userId, email, onSignOut }: AccountDropdownProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(cacheUserId === userId ? cachedProfile : null)
  const [tier, setTier] = useState<TierInfo>(cacheUserId === userId ? cachedTier : null)
  const ref = useRef<HTMLDivElement>(null)
  const fetchedRef = useRef(false)

  // Fetch profile + tier once per session
  useEffect(() => {
    if (fetchedRef.current && cacheUserId === userId) return
    fetchedRef.current = true
    cacheUserId = userId

    const supabase = createClient()
    supabase
      .from('hunter_profiles')
      .select('display_name, phone, residency_state, avatar_url')
      .eq('id', userId)
      .single()
      .then(({ data }) => {
        if (data) {
          cachedProfile = data
          setProfile(data)
        }
      })
    // Fetch admin status + highest module tier
    Promise.all([
      supabase.from('members').select('is_admin').eq('id', userId).single(),
      supabase.from('module_subscriptions').select('tier').eq('user_id', userId).eq('status', 'active'),
    ]).then(([memberRes, subsRes]) => {
      const is_admin = memberRes.data?.is_admin ?? false
      let highestTier: ModuleTier = 'free'
      for (const row of subsRes.data ?? []) {
        const t = row.tier as ModuleTier
        if (MODULE_TIER_RANK[t] > MODULE_TIER_RANK[highestTier]) highestTier = t
      }
      const info: TierInfo = { highestTier, is_admin }
      cachedTier = info
      setTier(info)
    })
  }, [userId])

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    if (open) document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open])

  const displayName = profile?.display_name || email.split('@')[0]
  const initials = displayName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-sm text-secondary hover:text-primary transition-colors rounded-lg px-2 py-1.5 hover:bg-surface"
      >
        {profile?.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt=""
            className="h-7 w-7 rounded-full object-cover border border-subtle"
          />
        ) : (
          <div className="h-7 w-7 rounded-full bg-accent/20 text-accent flex items-center justify-center text-xs font-semibold">
            {initials}
          </div>
        )}
        <span className="hidden sm:inline font-medium text-primary text-xs">
          {displayName}
        </span>
        <ChevronDown className={`h-3.5 w-3.5 text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-elevated border border-default rounded-lg shadow-xl z-[60] overflow-hidden">
          {/* Profile card */}
          <div className="px-4 py-3 border-b border-subtle">
            <div className="flex items-center gap-3">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt=""
                  className="h-10 w-10 rounded-full object-cover border border-subtle"
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-accent/20 text-accent flex items-center justify-center text-sm font-semibold">
                  {initials}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-primary truncate">{displayName}</p>
                <div className="flex items-center gap-2">
                  {tier && (
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-accent bg-accent/15 px-1.5 py-0.5 rounded">
                      {MODULE_TIER_LABELS[tier.highestTier]} Member
                    </span>
                  )}
                  {profile?.residency_state && (
                    <span className="text-xs text-muted">{profile.residency_state}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-3 space-y-1.5">
              <div className="flex items-center gap-2 text-xs text-secondary">
                <Mail className="h-3.5 w-3.5 text-muted flex-shrink-0" />
                <span className="truncate">{email}</span>
              </div>
              {profile?.phone && (
                <div className="flex items-center gap-2 text-xs text-secondary">
                  <Phone className="h-3.5 w-3.5 text-muted flex-shrink-0" />
                  <span>{profile.phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Links */}
          <div className="py-1.5">
            <Link
              href="/home"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-xs text-secondary hover:text-primary hover:bg-surface transition-colors"
            >
              <LayoutGrid className="h-4 w-4 text-muted" />
              Command Center
            </Link>
            <Link
              href="/account/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-xs text-secondary hover:text-primary hover:bg-surface transition-colors"
            >
              <User className="h-4 w-4 text-muted" />
              Edit Profile
            </Link>
            <Link
              href="/account/subscriptions"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-xs text-secondary hover:text-primary hover:bg-surface transition-colors"
            >
              <CreditCard className="h-4 w-4 text-muted" />
              Subscriptions
            </Link>
            <Link
              href="/account/change-password"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-xs text-secondary hover:text-primary hover:bg-surface transition-colors"
            >
              <KeyRound className="h-4 w-4 text-muted" />
              Change Password
            </Link>
          </div>

          {/* Admin */}
          {tier?.is_admin && (
            <div className="border-t border-subtle py-1.5">
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2 text-xs text-accent hover:text-accent hover:bg-accent/5 transition-colors"
              >
                <Shield className="h-4 w-4" />
                Admin Panel
              </Link>
            </div>
          )}

          {/* Sign out */}
          <div className="border-t border-subtle py-1.5">
            <button
              onClick={() => {
                setOpen(false)
                onSignOut()
              }}
              className="flex items-center gap-3 px-4 py-2 w-full text-xs text-secondary hover:text-primary hover:bg-surface transition-colors"
            >
              <LogOut className="h-4 w-4 text-muted" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
