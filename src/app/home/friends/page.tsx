'use client'

import { useState, useEffect } from 'react'
import {
  Search, UserPlus, Check, X, Users, Clock, UserMinus, MessageSquare, Loader2,
} from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { initials, displayLabel } from '@/lib/format'
import { useFriendActions } from '@/hooks/use-friend-actions'

export default function FriendsPage() {
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  const {
    friends, setFriends, searchQuery, setSearchQuery, searchResults, searching,
    actionLoading, error, accepted, pendingIn, pendingOut,
    sendRequest, respond, removeFriend,
  } = useFriendActions({ initialFriends: [], currentUserId })

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
  }, [setFriends])

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
