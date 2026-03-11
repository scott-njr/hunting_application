'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Mail, Users } from 'lucide-react'
import { PraeviusWordmark } from '@/components/ui/praevius-wordmark'
import { AccountDropdown } from '@/components/layout/account-dropdown'
import { createClient } from '@/lib/supabase/client'
import { useSignOut } from '@/hooks/use-sign-out'

interface ModuleHeaderProps {
  userId: string
  email: string
  /** @deprecated Messages now always link to /home/messages */
  messagesHref?: string
}

export function ModuleHeader({ userId, email }: ModuleHeaderProps) {
  const handleSignOut = useSignOut()
  const [pendingRequests, setPendingRequests] = useState(0)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('social_friendships')
      .select('id', { count: 'exact', head: true })
      .eq('recipient_id', userId)
      .eq('status', 'pending')
      .then(({ count }) => {
        setPendingRequests(count ?? 0)
      })
  }, [userId])

  return (
    <header className="hidden lg:flex items-center justify-between border-b border-subtle bg-surface px-6 h-12 shrink-0">
      <Link href="/" className="hover:opacity-80 transition-opacity">
        <PraeviusWordmark size="sm" />
      </Link>
      <div className="flex items-center gap-3">
        <Link
          href="/home/friends"
          className="relative p-2 text-muted hover:text-primary transition-colors"
          title="Friends"
        >
          <Users className="h-4 w-4" />
          {pendingRequests > 0 && (
            <span className="absolute top-1 right-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white px-0.5">
              {pendingRequests > 9 ? '9+' : pendingRequests}
            </span>
          )}
        </Link>
        <Link
          href="/home/messages"
          className="p-2 text-muted hover:text-primary transition-colors"
          title="Messages"
        >
          <Mail className="h-4.5 w-4.5" />
        </Link>
        <AccountDropdown userId={userId} email={email} onSignOut={handleSignOut} />
      </div>
    </header>
  )
}
