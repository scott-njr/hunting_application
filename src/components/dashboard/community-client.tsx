'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Search, UserPlus, Check, X, Users, Clock, UserMinus,
  MessageSquare,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { FeedPanel } from '@/components/community/feed-panel'
import { DmPanel } from '@/components/community/dm-panel'
import { BuddyMatchesCard } from '@/components/community/buddy-matches-card'

type Friend = {
  friendship_id: string
  friend_id: string
  display_name: string | null
  email: string
  direction: 'sent' | 'received'
  status: 'pending' | 'accepted' | 'declined' | 'blocked'
  created_at: string
}

type SearchResult = {
  user_id: string
  display_name: string | null
  email: string
}

type Props = {
  initialFriends: Friend[]
  currentUserId: string
}

function initials(name: string | null, email: string): string {
  if (name) return name.slice(0, 2).toUpperCase()
  return email.slice(0, 2).toUpperCase()
}

function displayLabel(f: Friend) { return f.display_name || f.email }

export default function CommunityClient({ initialFriends, currentUserId }: Props) {
  const [mobileTab, setMobileTab] = useState<'feed' | 'people' | 'messages'>('feed')
  const [friends, setFriends] = useState<Friend[]>(initialFriends)
  const [activeDmFriend, setActiveDmFriend] = useState<Friend | null>(null)

  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [friendActionLoading, setFriendActionLoading] = useState<string | null>(null)
  const [friendError, setFriendError] = useState<string | null>(null)
  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const accepted = friends.filter(f => f.status === 'accepted')
  const pendingIn = friends.filter(f => f.status === 'pending' && f.direction === 'received')
  const pendingOut = friends.filter(f => f.status === 'pending' && f.direction === 'sent')

  // Debounced search
  useEffect(() => {
    if (searchQuery.length < 2) { setSearchResults([]); return }
    if (searchRef.current) clearTimeout(searchRef.current)
    searchRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`/api/users/find?q=${encodeURIComponent(searchQuery)}`)
        const data = await res.json()
        const existingIds = new Set([currentUserId, ...friends.map(f => f.friend_id)])
        setSearchResults((data.results ?? []).filter((r: SearchResult) => !existingIds.has(r.user_id)))
      } finally { setSearching(false) }
    }, 400)
    return () => { if (searchRef.current) clearTimeout(searchRef.current) }
  }, [searchQuery, friends, currentUserId])

  // Friend actions
  async function sendRequest(recipientId: string) {
    setFriendActionLoading(recipientId)
    setFriendError(null)
    try {
      const res = await fetch('/api/friends/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipient_id: recipientId }),
      })
      if (!res.ok) { const d = await res.json(); setFriendError(d.error ?? 'Failed'); return }
      const target = searchResults.find(r => r.user_id === recipientId)
      if (target) {
        setFriends(prev => [...prev, {
          friendship_id: crypto.randomUUID(),
          friend_id: recipientId,
          display_name: target.display_name,
          email: target.email,
          direction: 'sent',
          status: 'pending',
          created_at: new Date().toISOString(),
        }])
        setSearchResults(prev => prev.filter(r => r.user_id !== recipientId))
      }
    } finally { setFriendActionLoading(null) }
  }

  async function respond(friendshipId: string, action: 'accept' | 'decline') {
    setFriendActionLoading(friendshipId)
    try {
      const res = await fetch('/api/friends/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendship_id: friendshipId, action }),
      })
      if (!res.ok) return
      if (action === 'accept') {
        setFriends(prev => prev.map(f => f.friendship_id === friendshipId ? { ...f, status: 'accepted' } : f))
      } else {
        setFriends(prev => prev.filter(f => f.friendship_id !== friendshipId))
      }
    } finally { setFriendActionLoading(null) }
  }

  async function removeFriend(friendshipId: string) {
    setFriendActionLoading(friendshipId)
    try {
      await fetch(`/api/friends/${friendshipId}`, { method: 'DELETE' })
      setFriends(prev => prev.filter(f => f.friendship_id !== friendshipId))
      if (activeDmFriend?.friendship_id === friendshipId) setActiveDmFriend(null)
    } finally { setFriendActionLoading(null) }
  }

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
                      <button onClick={() => respond(f.friendship_id, 'accept')} disabled={friendActionLoading === f.friendship_id} className="text-accent-hover disabled:opacity-50 transition-colors" aria-label="Accept friend request"><Check className="w-4 h-4" /></button>
                      <button onClick={() => respond(f.friendship_id, 'decline')} disabled={friendActionLoading === f.friendship_id} className="text-muted hover:text-red-400 disabled:opacity-50 transition-colors" aria-label="Decline friend request"><X className="w-4 h-4" /></button>
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
                    <button onClick={() => removeFriend(f.friendship_id)} disabled={friendActionLoading === f.friendship_id} className="text-muted hover:text-red-400 disabled:opacity-50 transition-colors ml-1" aria-label="Remove friend">
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
                className="w-full bg-elevated border border-default text-primary rounded pl-8 pr-3 py-1.5 text-xs focus:border-accent focus:outline-none placeholder:text-muted"
              />
            </div>
            {friendError && <p className="mt-1 text-xs text-red-400">{friendError}</p>}
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
                        <p className="text-xs text-primary">{r.display_name || r.email}</p>
                        {r.display_name && <p className="text-xs text-muted">{r.email}</p>}
                      </div>
                      <button onClick={() => sendRequest(r.user_id)} disabled={friendActionLoading === r.user_id} className="flex items-center gap-1 text-xs btn-primary disabled:opacity-50 px-2 py-1 rounded transition-colors">
                        <UserPlus className="w-3 h-3" />
                        {friendActionLoading === r.user_id ? '...' : 'Add'}
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
                    <button onClick={() => removeFriend(f.friendship_id)} disabled={friendActionLoading === f.friendship_id} className="text-xs text-muted hover:text-red-400 transition-colors">Cancel</button>
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
      {/* ── Mobile tabs (hidden on lg+) ── */}
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

      {/* ── Desktop: 2-column layout (hidden on mobile) ── */}
      <div className="hidden lg:grid lg:grid-cols-3 lg:gap-6">
        <div className="lg:col-span-2">
          <FeedPanel currentUserId={currentUserId} />
        </div>
        <div className="lg:col-span-1">
          {rightSidebar}
        </div>
      </div>

      {/* ── Mobile: tab content ── */}
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
