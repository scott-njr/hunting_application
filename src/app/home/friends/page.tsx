'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Search, UserPlus, Check, X, Users, Clock, UserMinus, MessageSquare, Loader2,
} from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

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

export default function FriendsPage() {
  const [friends, setFriends] = useState<Friend[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load friends + current user
  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setCurrentUserId(user.id)

      const res = await fetch('/api/friends?status=all')
      if (res.ok) {
        const data = await res.json()
        setFriends(data.friends ?? [])
      }
      setLoading(false)
    }
    load()
  }, [])

  const accepted = friends.filter(f => f.status === 'accepted')
  const pendingIn = friends.filter(f => f.status === 'pending' && f.direction === 'received')
  const pendingOut = friends.filter(f => f.status === 'pending' && f.direction === 'sent')

  // Search users
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
    setActionLoading(recipientId)
    setError(null)
    try {
      const res = await fetch('/api/friends/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipient_id: recipientId }),
      })
      if (!res.ok) { const d = await res.json(); setError(d.error ?? 'Failed to send request'); return }
      const target = searchResults.find(r => r.user_id === recipientId)
      if (target) {
        setFriends(prev => [...prev, {
          friendship_id: crypto.randomUUID(),
          friend_id: recipientId,
          display_name: target.display_name,
          email: '',
          direction: 'sent' as const,
          status: 'pending' as const,
          created_at: new Date().toISOString(),
        }])
        setSearchResults(prev => prev.filter(r => r.user_id !== recipientId))
      }
    } finally { setActionLoading(null) }
  }

  async function respond(friendshipId: string, action: 'accept' | 'decline') {
    setActionLoading(friendshipId)
    try {
      const res = await fetch('/api/friends/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendship_id: friendshipId, action }),
      })
      if (!res.ok) return
      if (action === 'accept') {
        setFriends(prev => prev.map(f => f.friendship_id === friendshipId ? { ...f, status: 'accepted' as const } : f))
      } else {
        setFriends(prev => prev.filter(f => f.friendship_id !== friendshipId))
      }
    } finally { setActionLoading(null) }
  }

  async function removeFriend(friendshipId: string) {
    setActionLoading(friendshipId)
    try {
      await fetch(`/api/friends/${friendshipId}`, { method: 'DELETE' })
      setFriends(prev => prev.filter(f => f.friendship_id !== friendshipId))
    } finally { setActionLoading(null) }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-5 w-5 animate-spin text-muted" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-primary">Friends</h1>
        <p className="text-xs text-muted mt-1">Manage your connections across all modules.</p>
      </div>

      {/* Search */}
      <div className="bg-elevated border border-subtle rounded-lg p-4">
        <h2 className="text-xs font-semibold text-secondary uppercase tracking-wider mb-3">Find Members</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full bg-elevated border border-default text-primary rounded-lg pl-10 pr-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent-ring placeholder:text-muted"
          />
        </div>
        {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
        {searchQuery.length >= 2 && (
          <div className="mt-3 border border-subtle rounded-lg overflow-hidden">
            {searching ? (
              <p className="px-4 py-3 text-sm text-muted">Searching...</p>
            ) : searchResults.length === 0 ? (
              <p className="px-4 py-3 text-sm text-muted">No members found</p>
            ) : (
              searchResults.map(r => (
                <div key={r.user_id} className="flex items-center justify-between px-4 py-3 border-b border-subtle last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-surface flex items-center justify-center text-xs font-semibold text-primary shrink-0">
                      {initials(r.display_name, r.user_name ?? '')}
                    </div>
                    <div>
                      <p className="text-sm text-primary">{r.display_name || r.user_name || 'Member'}</p>
                      {r.user_name && <p className="text-xs text-muted">@{r.user_name}</p>}
                    </div>
                  </div>
                  <button
                    onClick={() => sendRequest(r.user_id)}
                    disabled={actionLoading === r.user_id}
                    className="flex items-center gap-1.5 text-xs btn-primary disabled:opacity-50 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    {actionLoading === r.user_id ? '...' : 'Add'}
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Incoming Requests */}
      {pendingIn.length > 0 && (
        <div className="bg-elevated border border-subtle rounded-lg p-4">
          <h2 className="text-xs font-semibold text-secondary uppercase tracking-wider mb-3 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5" />
            Incoming Requests
            <span className="bg-accent text-primary text-xs px-1.5 py-0.5 rounded-full font-bold">{pendingIn.length}</span>
          </h2>
          <div className="space-y-2">
            {pendingIn.map(f => (
              <div key={f.friendship_id} className="flex items-center justify-between py-2 px-3 bg-surface rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-xs font-semibold text-accent shrink-0">
                    {initials(f.display_name, f.email)}
                  </div>
                  <div>
                    <p className="text-sm text-primary">{displayLabel(f)}</p>
                    <p className="text-xs text-muted">Wants to connect</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => respond(f.friendship_id, 'accept')}
                    disabled={actionLoading === f.friendship_id}
                    className="text-accent-hover disabled:opacity-50 transition-colors p-2 hover:bg-accent/10 rounded"
                    aria-label="Accept"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => respond(f.friendship_id, 'decline')}
                    disabled={actionLoading === f.friendship_id}
                    className="text-muted hover:text-red-400 disabled:opacity-50 transition-colors p-2 hover:bg-red-400/10 rounded"
                    aria-label="Decline"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Outgoing Requests */}
      {pendingOut.length > 0 && (
        <div className="bg-elevated border border-subtle rounded-lg p-4">
          <h2 className="text-xs font-semibold text-secondary uppercase tracking-wider mb-3 flex items-center gap-2">
            <UserPlus className="w-3.5 h-3.5" />
            Sent Requests
          </h2>
          <div className="space-y-2">
            {pendingOut.map(f => (
              <div key={f.friendship_id} className="flex items-center justify-between py-2 px-3 bg-surface rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-surface border border-subtle flex items-center justify-center text-xs font-semibold text-secondary shrink-0">
                    {initials(f.display_name, f.email)}
                  </div>
                  <div>
                    <p className="text-sm text-primary">{displayLabel(f)}</p>
                    <p className="text-xs text-muted">Pending</p>
                  </div>
                </div>
                <button
                  onClick={() => removeFriend(f.friendship_id)}
                  disabled={actionLoading === f.friendship_id}
                  className="text-xs text-muted hover:text-red-400 transition-colors px-3 py-1.5"
                >
                  Cancel
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Accepted Friends */}
      <div className="bg-elevated border border-subtle rounded-lg p-4">
        <h2 className="text-xs font-semibold text-secondary uppercase tracking-wider mb-3 flex items-center gap-2">
          <Users className="w-3.5 h-3.5" />
          My Friends
          {accepted.length > 0 && <span className="text-muted font-normal normal-case tracking-normal">({accepted.length})</span>}
        </h2>
        {accepted.length === 0 ? (
          <p className="text-sm text-muted">No friends yet. Use the search above to find and connect with other members.</p>
        ) : (
          <div className="space-y-1">
            {accepted.map(f => (
              <div key={f.friendship_id} className="flex items-center justify-between py-2 px-3 hover:bg-surface rounded-lg transition-colors">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-surface flex items-center justify-center text-xs font-semibold text-primary shrink-0">
                    {initials(f.display_name, f.email)}
                  </div>
                  <span className="text-sm text-secondary truncate">{displayLabel(f)}</span>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <Link
                    href="/home/messages"
                    className="text-muted hover:text-accent transition-colors p-2"
                    aria-label="Message"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => removeFriend(f.friendship_id)}
                    disabled={actionLoading === f.friendship_id}
                    className="text-muted hover:text-red-400 disabled:opacity-50 transition-colors p-2"
                    aria-label="Remove friend"
                  >
                    <UserMinus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
