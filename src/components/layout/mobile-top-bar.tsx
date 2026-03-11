'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { Menu, Users, Mail } from 'lucide-react'
import { PraeviusWordmark } from '@/components/ui/praevius-wordmark'

interface MobileTopBarProps {
  onMenuOpen: () => void
  messagesHref: string
}

export function MobileTopBar({ onMenuOpen, messagesHref }: MobileTopBarProps) {
  const [pendingFriendCount, setPendingFriendCount] = useState(0)
  const friendsFetchedRef = useRef(false)

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
    </div>
  )
}
