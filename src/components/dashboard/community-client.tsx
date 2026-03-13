'use client'

import { useState, useCallback } from 'react'
import {
  Search, UserPlus, Check, X, Users, Clock, UserMinus,
  MessageSquare,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { FeedPanel } from '@/components/community/feed-panel'
import { DmPanel } from '@/components/community/dm-panel'
import { BuddyMatchesCard } from '@/components/community/buddy-matches-card'
import { initials, displayLabel } from '@/lib/format'
import { useFriendActions } from '@/hooks/use-friend-actions'
import type { Friend } from '@/types/friends'

type Props = {
  initialFriends: Friend[]
  currentUserId: string
}

export default function CommunityClient({ initialFriends, currentUserId }: Props) {
  const [mobileTab, setMobileTab] = useState<'feed' | 'people' | 'messages'>('feed')
  const [activeDmFriend, setActiveDmFriend] = useState<Friend | null>(null)

  const handleRemoveFriend = useCallback((friendshipId: string) => {
    if (activeDmFriend?.friendship_id === friendshipId) setActiveDmFriend(null)
  }, [activeDmFriend])

  const {
    searchQuery, setSearchQuery, searchResults, searching,
    actionLoading, error, accepted, pendingIn, pendingOut,
    sendRequest, respond, removeFriend,
  } = useFriendActions({ initialFriends, currentUserId, onRemoveFriend: handleRemoveFriend })

  // Right sidebar content (buddy matches, circle, requests, search, DM)
  const rightSidebar = (
    <div className="space-y-3">
      {activeDmFriend ? (
        <DmPanel
          friend={activeDmFriend}
          currentUserId={currentUserId}
          onBack={() => setActiveDmFriend(null)}
        />
      ) : (
        <>
          {/* Buddy matches */}
          <BuddyMatchesCard onSendRequest={sendRequest} />

          {/* Pending requests */}
          {pendingIn.length > 0 && (
            <div className="bg-elevated border border-subtle rounded-lg p-3">
              <h3 className="text-xs font-semibold text-secondary uppercase tracking-wider mb-2 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5" />
                Requests
                <span className="bg-accent text-primary text-xs px-1.5 py-0.5 rounded-full">{pendingIn.length}</span>
              </h3>
              <div className="space-y-2">
                {pendingIn.map(f => (
                  <div key={f.friendship_id} className="flex items-center justify-between">
                    <p className="text-xs text-primary">{displayLabel(f)}</p>
                    <div className="flex gap-1">
                      <button onClick={() => respond(f.friendship_id, 'accept')} disabled={actionLoading === f.friendship_id} className="text-accent-hover disabled:opacity-50 transition-colors" aria-label="Accept friend request"><Check className="w-4 h-4" /></button>
                      <button onClick={() => respond(f.friendship_id, 'decline')} disabled={actionLoading === f.friendship_id} className="text-muted hover:text-red-400 disabled:opacity-50 transition-colors" aria-label="Decline friend request"><X className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* My Circle */}
          <div className="bg-elevated border border-subtle rounded-lg p-3">
            <h3 className="text-xs font-semibold text-secondary uppercase tracking-wider mb-2 flex items-center gap-2">
              <Users className="w-3.5 h-3.5" />
              My Circle
              {accepted.length > 0 && <span className="text-muted font-normal normal-case tracking-normal">({accepted.length})</span>}
            </h3>
            {accepted.length === 0 ? (
              <p className="text-xs text-muted">No confirmed friends yet.</p>
            ) : (
              <div className="space-y-1">
                {accepted.map(f => (
                  <div key={f.friendship_id} className="flex items-center justify-between py-1">
                    <button
                      onClick={() => setActiveDmFriend(f)}
                      className="flex items-center gap-2 flex-1 min-w-0 group"
                    >
                      <div className="w-6 h-6 rounded-full bg-elevated flex items-center justify-center text-xs font-semibold text-primary shrink-0">
                        {initials(f.display_name, f.email)}
                      </div>
                      <span className="text-xs text-secondary group-hover:text-primary transition-colors truncate">{displayLabel(f)}</span>
                      <MessageSquare className="w-3 h-3 text-muted group-hover:text-accent-hover transition-colors shrink-0" />
                    </button>
                    <button onClick={() => removeFriend(f.friendship_id)} disabled={actionLoading === f.friendship_id} className="text-muted hover:text-red-400 disabled:opacity-50 transition-colors ml-1" aria-label="Remove friend">
                      <UserMinus className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Find Members */}
          <div className="bg-elevated border border-subtle rounded-lg p-3">
            <h3 className="text-xs font-semibold text-secondary uppercase tracking-wider mb-2">Find Members</h3>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full bg-elevated border border-default text-primary rounded pl-8 pr-3 py-1.5 text-base sm:text-xs focus:border-accent focus:outline-none placeholder:text-muted"
              />
            </div>
            {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
            {searchQuery.length >= 2 && (
              <div className="mt-2 border border-subtle rounded overflow-hidden">
                {searching ? (
                  <p className="px-3 py-2 text-xs text-muted">Searching...</p>
                ) : searchResults.length === 0 ? (
                  <p className="px-3 py-2 text-xs text-muted">No members found</p>
                ) : (
                  searchResults.map(r => (
                    <div key={r.user_id} className="flex items-center justify-between px-3 py-2 border-b border-subtle last:border-0">
                      <div>
                        <p className="text-xs text-primary">{r.display_name || r.user_name || 'Member'}</p>
                        {r.user_name && <p className="text-xs text-muted">@{r.user_name}</p>}
                      </div>
                      <button onClick={() => sendRequest(r.user_id)} disabled={actionLoading === r.user_id} className="flex items-center gap-1 text-xs btn-primary disabled:opacity-50 px-2 py-1 rounded transition-colors">
                        <UserPlus className="w-3 h-3" />
                        {actionLoading === r.user_id ? '...' : 'Add'}
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Sent requests */}
          {pendingOut.length > 0 && (
            <div className="bg-elevated border border-subtle rounded-lg p-3">
              <h3 className="text-xs font-semibold text-secondary uppercase tracking-wider mb-2">Sent Requests</h3>
              <div className="space-y-1">
                {pendingOut.map(f => (
                  <div key={f.friendship_id} className="flex items-center justify-between">
                    <p className="text-xs text-secondary">{displayLabel(f)}</p>
                    <button onClick={() => removeFriend(f.friendship_id)} disabled={actionLoading === f.friendship_id} className="text-xs text-muted hover:text-red-400 transition-colors">Cancel</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )

  return (
    <>
      {/* Mobile tabs (hidden on lg+) */}
      <div className="flex gap-1 border-b border-subtle pb-0 lg:hidden mb-4">
        {([
          { key: 'feed' as const, label: 'Feed' },
          { key: 'people' as const, label: `People${pendingIn.length > 0 ? ` (${pendingIn.length})` : ''}` },
          { key: 'messages' as const, label: `Messages${accepted.length > 0 ? ` · ${accepted.length}` : ''}` },
        ]).map(tab => (
          <button
            key={tab.key}
            onClick={() => setMobileTab(tab.key)}
            className={cn(
              'px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
              mobileTab === tab.key ? 'text-primary border-accent' : 'text-muted border-transparent hover:text-secondary'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Desktop: 2-column layout (hidden on mobile) */}
      <div className="hidden lg:grid lg:grid-cols-3 lg:gap-6">
        <div className="lg:col-span-2">
          <FeedPanel currentUserId={currentUserId} />
        </div>
        <div className="lg:col-span-1">
          {rightSidebar}
        </div>
      </div>

      {/* Mobile: tab content */}
      <div className="lg:hidden">
        {mobileTab === 'feed' && <FeedPanel currentUserId={currentUserId} />}

        {mobileTab === 'people' && rightSidebar}

        {mobileTab === 'messages' && (
          activeDmFriend ? (
            <DmPanel
              friend={activeDmFriend}
              currentUserId={currentUserId}
              onBack={() => setActiveDmFriend(null)}
            />
          ) : accepted.length === 0 ? (
            <div className="bg-elevated border border-subtle rounded-lg px-4 py-10 text-center">
              <MessageSquare className="w-8 h-8 text-muted mx-auto mb-2" />
              <p className="text-sm text-muted">No friends yet.</p>
              <p className="text-xs text-muted mt-1">
                Add members in the{' '}
                <button onClick={() => setMobileTab('people')} className="text-accent-hover">People tab</button>
                {' '}to start messaging.
              </p>
            </div>
          ) : (
            <div className="bg-elevated border border-subtle rounded-lg divide-y divide-subtle">
              {accepted.map(f => (
                <button
                  key={f.friendship_id}
                  onClick={() => setActiveDmFriend(f)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-elevated transition-colors text-left"
                >
                  <div className="w-9 h-9 rounded-full bg-elevated flex items-center justify-center text-sm font-semibold text-primary shrink-0">
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
        )}
      </div>
    </>
  )
}
