'use client'

import { useState, useEffect } from 'react'
import { UserPlus, ShieldCheck, Target, Loader2, Facebook, Instagram } from 'lucide-react'
import type { BuddyMatch } from '@/app/api/community/buddy-matches/route'

function initials(name: string | null): string {
  if (!name) return '??'
  return name.slice(0, 2).toUpperCase()
}

export function BuddyMatchesCard({
  onSendRequest,
}: {
  onSendRequest: (userId: string) => Promise<void>
}) {
  const [matches, setMatches] = useState<BuddyMatch[]>([])
  const [mentors, setMentors] = useState<BuddyMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [notVerified, setNotVerified] = useState(false)
  const [incompleteProfile, setIncompleteProfile] = useState(false)
  const [sendingTo, setSendingTo] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/community/buddy-matches')
      .then(r => r.json())
      .then(data => {
        setMatches(data.matches ?? [])
        setMentors(data.mentors ?? [])
        setNotVerified(data.not_verified ?? false)
        setIncompleteProfile(data.incomplete_profile ?? false)
      })
      .finally(() => setLoading(false))
  }, [])

  async function handleConnect(userId: string) {
    setSendingTo(userId)
    try {
      await onSendRequest(userId)
      setMatches(prev => prev.filter(m => m.user_id !== userId))
      setMentors(prev => prev.filter(m => m.user_id !== userId))
    } finally {
      setSendingTo(null)
    }
  }

  if (loading) {
    return (
      <div className="bg-elevated border border-subtle rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Target className="h-3.5 w-3.5 text-accent-hover" />
          <h3 className="text-xs font-semibold text-secondary uppercase tracking-wider">Suggested Members</h3>
        </div>
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-4 w-4 text-muted animate-spin" />
        </div>
      </div>
    )
  }

  if (notVerified) {
    return (
      <div className="bg-elevated border border-subtle rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Target className="h-3.5 w-3.5 text-accent-hover" />
          <h3 className="text-xs font-semibold text-secondary uppercase tracking-wider">Suggested Members</h3>
        </div>
        <div className="text-center py-3">
          <ShieldCheck className="h-6 w-6 text-muted mx-auto mb-2" />
          <p className="text-muted text-xs">Get verified to see suggested members</p>
          <p className="text-muted text-[10px] mt-1">Add a profile photo to get started</p>
        </div>
      </div>
    )
  }

  if (incompleteProfile) {
    return (
      <div className="bg-elevated border border-subtle rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Target className="h-3.5 w-3.5 text-accent-hover" />
          <h3 className="text-xs font-semibold text-secondary uppercase tracking-wider">Suggested Members</h3>
        </div>
        <p className="text-muted text-xs text-center py-2">Complete your profile (species + states) to see matches</p>
      </div>
    )
  }

  const all = [...matches, ...mentors.filter(m => !matches.some(b => b.user_id === m.user_id))]
  if (all.length === 0) {
    return (
      <div className="bg-elevated border border-subtle rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Target className="h-3.5 w-3.5 text-accent-hover" />
          <h3 className="text-xs font-semibold text-secondary uppercase tracking-wider">Suggested Members</h3>
        </div>
        <p className="text-muted text-xs text-center py-2">No matches yet. As more members join, you&apos;ll see suggestions here.</p>
      </div>
    )
  }

  return (
    <div className="bg-elevated border border-subtle rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <Target className="h-3.5 w-3.5 text-accent-hover" />
        <h3 className="text-xs font-semibold text-secondary uppercase tracking-wider">Suggested Members</h3>
      </div>
      <div className="space-y-3">
        {all.slice(0, 5).map(match => (
          <div key={match.user_id} className="flex items-start gap-2.5">
            {/* Avatar */}
            <div className="w-9 h-9 rounded-full overflow-hidden bg-elevated flex items-center justify-center text-xs font-semibold text-primary shrink-0">
              {match.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={match.avatar_url} alt={match.display_name ?? 'Member'} className="w-full h-full object-cover" />
              ) : (
                initials(match.display_name)
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-primary text-xs font-medium truncate">
                  {match.display_name ?? 'Member'}
                </span>
                {match.is_verified && <ShieldCheck className="h-3 w-3 text-accent-hover shrink-0" />}
                {match.willing_to_mentor && (
                  <span className="text-[10px] text-amber-400 bg-amber-900/30 px-1.5 py-0.5 rounded shrink-0">Mentor</span>
                )}
              </div>

              {/* Overlap pills */}
              <div className="flex flex-wrap gap-1 mb-1">
                {match.overlap_reasons.map(reason => (
                  <span key={reason} className="text-[10px] text-accent-hover bg-accent-dim px-1.5 py-0.5 rounded">
                    {reason}
                  </span>
                ))}
                {match.home_state && (
                  <span className="text-[10px] text-muted">{match.home_state}</span>
                )}
              </div>

              {match.buddy_bio && (
                <p className="text-muted text-[10px] leading-snug line-clamp-2">{match.buddy_bio}</p>
              )}

              {(match.social_facebook || match.social_instagram || match.social_x) && (
                <div className="flex gap-2 mt-1">
                  {match.social_facebook && (
                    <a href={match.social_facebook} target="_blank" rel="noopener noreferrer" className="text-muted hover:text-blue-400 transition-colors" aria-label="Facebook">
                      <Facebook className="h-3 w-3" />
                    </a>
                  )}
                  {match.social_instagram && (
                    <a href={match.social_instagram} target="_blank" rel="noopener noreferrer" className="text-muted hover:text-pink-400 transition-colors" aria-label="Instagram">
                      <Instagram className="h-3 w-3" />
                    </a>
                  )}
                  {match.social_x && (
                    <a href={match.social_x} target="_blank" rel="noopener noreferrer" className="text-muted hover:text-primary transition-colors" aria-label="X">
                      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                    </a>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={() => handleConnect(match.user_id)}
              disabled={sendingTo === match.user_id}
              className="flex items-center gap-1 text-[10px] font-medium text-accent-hover hover:text-accent bg-accent-dim px-2 py-1 rounded transition-colors shrink-0 disabled:opacity-50"
            >
              {sendingTo === match.user_id ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <UserPlus className="h-3 w-3" />
              )}
              Connect
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
