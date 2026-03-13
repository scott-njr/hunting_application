'use client'

import {
  Search, UserPlus, Check, X, Users, Clock, UserMinus,
} from 'lucide-react'
import { BuddyMatchesCard } from '@/components/community/buddy-matches-card'
import { initials, displayLabel } from '@/lib/format'
import { useFriendActions } from '@/hooks/use-friend-actions'
import type { Friend } from '@/types/friends'

export function PeopleClient({
  initialFriends,
  currentUserId,
}: {
  initialFriends: Friend[]
  currentUserId: string
}) {
  const {
    searchQuery, setSearchQuery, searchResults, searching,
    actionLoading, error, accepted, pendingIn, pendingOut,
    sendRequest, respond, removeFriend,
  } = useFriendActions({ initialFriends, currentUserId })

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left column: Buddy Matches + Requests */}
      <div className="space-y-3">
        <BuddyMatchesCard onSendRequest={sendRequest} />

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
                    <button onClick={() => respond(f.friendship_id, 'accept')} disabled={actionLoading === f.friendship_id} className="p-2 text-accent-hover disabled:opacity-50 transition-colors" aria-label="Accept friend request"><Check className="w-4 h-4" /></button>
                    <button onClick={() => respond(f.friendship_id, 'decline')} disabled={actionLoading === f.friendship_id} className="p-2 text-muted hover:text-red-400 disabled:opacity-50 transition-colors" aria-label="Decline friend request"><X className="w-4 h-4" /></button>
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
                  <button onClick={() => removeFriend(f.friendship_id)} disabled={actionLoading === f.friendship_id} className="text-xs text-muted hover:text-red-400 transition-colors">Cancel</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right column: My Circle + Find Members */}
      <div className="space-y-3">
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
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="w-6 h-6 rounded-full bg-elevated flex items-center justify-center text-xs font-semibold text-primary shrink-0">
                      {initials(f.display_name, f.email)}
                    </div>
                    <span className="text-xs text-secondary truncate">{displayLabel(f)}</span>
                  </div>
                  <button onClick={() => removeFriend(f.friendship_id)} disabled={actionLoading === f.friendship_id} className="text-muted hover:text-red-400 disabled:opacity-50 transition-colors ml-1" aria-label="Remove friend">
                    <UserMinus className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

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
      </div>
    </div>
  )
}
