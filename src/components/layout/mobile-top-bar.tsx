'use client'

import Link from 'next/link'
import { Menu, Users, Mail } from 'lucide-react'
import { PraeviusWordmark } from '@/components/ui/praevius-wordmark'
import { usePendingFriendCount } from '@/hooks/use-pending-friend-count'
import { useAuthCached } from '@/lib/use-auth-cached'

interface MobileTopBarProps {
  onMenuOpen: () => void
  messagesHref?: string
  showSocial?: boolean
}

export function MobileTopBar({ onMenuOpen, messagesHref = '/home/messages', showSocial = true }: MobileTopBarProps) {
  const { user } = useAuthCached()
  const pendingFriendCount = usePendingFriendCount(user?.id, showSocial)

  return (
    <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-surface border-b border-subtle px-4 py-3 flex items-center justify-between">
      <button
        type="button"
        onClick={onMenuOpen}
        className="p-2.5 text-muted hover:text-primary transition-colors"
      >
        <Menu className="h-5 w-5" />
      </button>
      <Link href="/" className="hover:opacity-80 transition-opacity">
        <PraeviusWordmark size="sm" />
      </Link>
      {showSocial ? (
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
            href={messagesHref}
            className="p-2.5 text-muted hover:text-primary transition-colors"
            aria-label="Messages"
          >
            <Mail className="h-5 w-5" />
          </Link>
        </div>
      ) : (
        <div className="w-10" />
      )}
    </div>
  )
}
