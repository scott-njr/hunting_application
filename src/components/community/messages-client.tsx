'use client'

import { useState } from 'react'
import { MessageSquare } from 'lucide-react'
import { DmPanel } from '@/components/community/dm-panel'
import { initials, displayLabel } from '@/lib/format'
import type { Friend } from '@/types/friends'

export function MessagesClient({
  friends,
  currentUserId,
}: {
  friends: Friend[]
  currentUserId: string
}) {
  const [activeDmFriend, setActiveDmFriend] = useState<Friend | null>(null)

  if (activeDmFriend) {
    return (
      <div>
        <DmPanel
          friend={activeDmFriend}
          currentUserId={currentUserId}
          onBack={() => setActiveDmFriend(null)}
        />
      </div>
    )
  }

  if (friends.length === 0) {
    return (
      <div className="bg-elevated border border-subtle rounded-lg px-4 py-10 text-center">
        <MessageSquare className="w-8 h-8 text-muted mx-auto mb-2" />
        <p className="text-sm text-muted">No friends yet.</p>
        <p className="text-xs text-muted mt-1">
          Add hunters in the People tab to start messaging.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-elevated border border-subtle rounded-lg divide-y divide-subtle">
      {friends.map(f => (
        <button
          key={f.friendship_id}
          onClick={() => setActiveDmFriend(f)}
          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface transition-colors text-left"
        >
          <div className="w-9 h-9 rounded-full bg-surface flex items-center justify-center text-sm font-semibold text-primary shrink-0">
            {initials(f.display_name, f.email)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-primary font-medium truncate">{displayLabel(f)}</p>
            <p className="text-xs text-muted truncate">Tap to open conversation</p>
          </div>
          <MessageSquare className="w-4 h-4 text-muted shrink-0" />
        </button>
      ))}
    </div>
  )
}
