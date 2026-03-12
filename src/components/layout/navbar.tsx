'use client'

import Link from 'next/link'
import { Users, Mail, Menu } from 'lucide-react'
import { PraeviusWordmark } from '@/components/ui/praevius-wordmark'
import { AccountDropdown } from '@/components/layout/account-dropdown'
import { useAuthCached } from '@/lib/use-auth-cached'
import { useAuthModal } from '@/components/auth/auth-modal-provider'
import { useSignOut } from '@/hooks/use-sign-out'
import { usePendingFriendCount, resetPendingFriendCache } from '@/hooks/use-pending-friend-count'
import { useUnreadMessageCount, resetUnreadMessageCache } from '@/hooks/use-unread-message-count'

interface NavbarProps {
  showHamburger?: boolean
}

export function Navbar({ showHamburger }: NavbarProps) {
  const { user, loading } = useAuthCached()
  const { openAuthModal } = useAuthModal()
  const pendingCount = usePendingFriendCount(user?.id)
  const unreadMessages = useUnreadMessageCount(user?.id)

  const baseSignOut = useSignOut()
  async function handleSignOut() {
    resetPendingFriendCache()
    resetUnreadMessageCache()
    await baseSignOut()
  }

  return (
    <header className="border-b border-subtle bg-overlay backdrop-blur-sm sticky top-0 z-50">
      <div className={`${showHamburger ? '' : 'max-w-7xl mx-auto '}px-4 h-14 flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          {showHamburger && (
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('open-mobile-menu'))}
              className="lg:hidden p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-muted hover:text-primary transition-colors rounded-lg hover:bg-surface"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <PraeviusWordmark size="sm" />
          </Link>
        </div>
        <div className="flex items-center gap-3">
          {loading ? (
            <div className="w-16 h-8" />
          ) : user ? (
            <>
              <Link
                href="/home/friends"
                className="relative p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-muted hover:text-primary transition-colors rounded-lg hover:bg-surface"
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
                className="relative p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-muted hover:text-primary transition-colors rounded-lg hover:bg-surface"
                aria-label="Messages"
              >
                <Mail className="h-5 w-5" />
                {unreadMessages > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1">
                    {unreadMessages > 9 ? '9+' : unreadMessages}
                  </span>
                )}
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
              className="btn-primary text-sm rounded-full px-5 py-2"
            >
              Log In
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
