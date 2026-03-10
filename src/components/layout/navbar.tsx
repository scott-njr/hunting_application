'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Users, Mail } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { PraeviusWordmark } from '@/components/ui/praevius-wordmark'
import { AccountDropdown } from '@/components/layout/account-dropdown'
import { useAuthCached, clearAuthCache } from '@/lib/use-auth-cached'
import { useAuthModal } from '@/components/auth/auth-modal-provider'

// Cache pending count across mounts so nav doesn't flash
let cachedPendingCount = 0
let cacheUid: string | null = null

export function Navbar() {
  const router = useRouter()
  const { user, loading } = useAuthCached()
  const { openAuthModal } = useAuthModal()
  const [pendingCount, setPendingCount] = useState(cacheUid === user?.id ? cachedPendingCount : 0)
  const fetchedRef = useRef(false)

  // Fetch pending incoming friend request count
  useEffect(() => {
    if (!user || (fetchedRef.current && cacheUid === user.id)) return
    fetchedRef.current = true
    cacheUid = user.id

    fetch('/api/friends')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data?.friends) return
        const count = (data.friends as Array<{ direction: string; status: string }>)
          .filter(f => f.status === 'pending' && f.direction === 'received').length
        cachedPendingCount = count
        setPendingCount(count)
      })
      .catch(() => {})
  }, [user])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    clearAuthCache()
    cachedPendingCount = 0
    cacheUid = null
    router.push('/')
    router.refresh()
  }

  return (
    <header className="border-b border-subtle bg-overlay backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="hover:opacity-80 transition-opacity">
          <PraeviusWordmark size="sm" />
        </Link>
        <div className="flex items-center gap-3">
          {loading ? (
            <div className="w-16 h-8" />
          ) : user ? (
            <>
              <Link
                href="/home/friends"
                className="relative p-2 text-muted hover:text-primary transition-colors rounded-lg hover:bg-surface"
                aria-label="Friends"
              >
                <Users className="h-5 w-5" />
                {pendingCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1">
                    {pendingCount > 9 ? '9+' : pendingCount}
                  </span>
                )}
              </Link>
              <Link
                href="/home/messages"
                className="p-2 text-muted hover:text-primary transition-colors rounded-lg hover:bg-surface"
                aria-label="Messages"
              >
                <Mail className="h-5 w-5" />
              </Link>
              <AccountDropdown
                userId={user.id}
                email={user.email ?? ''}
                onSignOut={handleSignOut}
              />
            </>
          ) : (
            <button
              onClick={() => openAuthModal('login')}
              className="btn-primary text-sm rounded-full px-5 py-1.5"
            >
              Log In
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
