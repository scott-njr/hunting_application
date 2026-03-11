'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Search, UserPlus, Check, X, Users, Clock, UserMinus,
} from 'lucide-react'
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
  user_name: string | null
  avatar_url: string | null
}

function initials(name: string | null, email: string): string {
  if (name) return name.slice(0, 2).toUpperCase()
  return email.slice(0, 2).toUpperCase()
}

function displayLabel(f: Friend) { return f.display_name || f.email }

export function PeopleSidebar({
  initialFriends,
  currentUserId,
}: {
  initialFriends: Friend[]
  currentUserId: string
}) {
  const [friends, setFriends] = useState<Friend[]>(initialFriends)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [friendActionLoading, setFriendActionLoading] = useState<string | null>(null)
  const [friendError, setFriendError] = useState<string | null>(null)
  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const accepted = friends.filter(f => f.status === 'accepted')
  const pendingIn = friends.filter(f => f.status === 'pending' && f.direction === 'received')
  const pendingOut = friends.filter(f => f.status === 'pending' && f.direction === 'sent')

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
          email: '',
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
      const res = await fetch(`/api/friends/${friendshipId}`, { method: 'DELETE' })
      if (!res.ok) { setFriendError('Failed to remove friend'); return }
      setFriends(prev => prev.filter(f => f.friendship_id !== friendshipId))
    } finally { setFriendActionLoading(null) }
  }

  return (
    <div className="space-y-3">
      {/* 1. Find Members */}
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
                    <p className="text-xs text-primary">{r.display_name || r.user_name || 'Member'}</p>
                    {r.user_name && <p className="text-xs text-muted">@{r.user_name}</p>}
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

      {/* Pending requests (if any) */}
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
                  <button onClick={() => respond(f.friendship_id, 'accept')} disabled={friendActionLoading === f.friendship_id} className="text-accent-hover disabled:opacity-50 transition-colors p-2" aria-label="Accept friend request"><Check className="w-4 h-4" /></button>
                  <button onClick={() => respond(f.friendship_id, 'decline')} disabled={friendActionLoading === f.friendship_id} className="text-muted hover:text-red-400 disabled:opacity-50 transition-colors p-2" aria-label="Decline friend request"><X className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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

      {/* 2. My Community */}
      <div className="bg-elevated border border-subtle rounded-lg p-3">
        <h3 className="text-xs font-semibold text-secondary uppercase tracking-wider mb-2 flex items-center gap-2">
          <Users className="w-3.5 h-3.5" />
          My Community
          {accepted.length > 0 && <span className="text-muted font-normal normal-case tracking-normal">({accepted.length})</span>}
        </h3>
        {accepted.length === 0 ? (
          <p className="text-xs text-muted">No confirmed friends yet.</p>
        ) : (
          <div className="space-y-1">
            {accepted.map(f => (
              <div key={f.friendship_id} className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="w-6 h-6 rounded-full bg-surface flex items-center justify-center text-xs font-semibold text-primary shrink-0">
                    {initials(f.display_name, f.email)}
                  </div>
                  <span className="text-xs text-secondary truncate">{displayLabel(f)}</span>
                </div>
                <button onClick={() => removeFriend(f.friendship_id)} disabled={friendActionLoading === f.friendship_id} className="text-muted hover:text-red-400 disabled:opacity-50 transition-colors p-2 ml-1" aria-label="Remove friend">
                  <UserMinus className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Get Certified — Buddy Matches */}
      <BuddyMatchesCard onSendRequest={sendRequest} />
    </div>
  )
}
