'use client'

import { useState, useEffect } from 'react'
import { Share2, Swords, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Friend {
  friend_id: string
  display_name: string
}

type ItemType = 'run_session' | 'strength_session' | 'meal'
type Mode = 'share' | 'challenge'

interface ShareItemButtonProps {
  itemType: ItemType
  itemSnapshot: Record<string, unknown>
  sourcePlanId?: string
}

export function ShareItemButton({ itemType, itemSnapshot, sourcePlanId }: ShareItemButtonProps) {
  const [open, setOpen] = useState(false)
  const [friends, setFriends] = useState<Friend[]>([])
  const [selectedFriend, setSelectedFriend] = useState('')
  const [message, setMessage] = useState('')
  const [mode, setMode] = useState<Mode>('share')
  const [scoringType, setScoringType] = useState<'time' | 'reps'>('time')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const canChallenge = itemType !== 'meal'

  useEffect(() => {
    if (!open) return
    fetch('/api/friends')
      .then(r => r.json())
      .then(d => setFriends(d.friends ?? []))
  }, [open])

  function reset() {
    setOpen(false)
    setError('')
    setSuccess(false)
    setSelectedFriend('')
    setMessage('')
    setMode('share')
    setScoringType('time')
  }

  async function handleSubmit() {
    if (!selectedFriend) return
    setLoading(true)
    setError('')

    if (mode === 'share') {
      const res = await fetch('/api/fitness/plans/share-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient_id: selectedFriend,
          item_type: itemType,
          item_snapshot: itemSnapshot,
          source_plan_id: sourcePlanId ?? null,
          message: message.trim() || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to share'); setLoading(false); return }
    } else {
      const res = await fetch('/api/fitness/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challenged_id: selectedFriend,
          item_type: itemType,
          item_snapshot: itemSnapshot,
          scoring_type: scoringType,
          message: message.trim() || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to send challenge'); setLoading(false); return }
    }

    setSuccess(true)
    setLoading(false)
    setTimeout(reset, 1500)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-muted hover:text-accent transition-colors p-1"
        title="Share or challenge"
      >
        <Share2 className="h-3.5 w-3.5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-surface border border-subtle rounded-lg p-5 w-full max-w-sm mx-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-primary font-bold text-sm">
                {mode === 'share' ? 'Share with Friend' : 'Challenge a Friend'}
              </h3>
              <button onClick={reset} className="text-muted hover:text-secondary">
                <X className="h-4 w-4" />
              </button>
            </div>

            {success ? (
              <p className="text-green-400 text-sm">
                {mode === 'share' ? 'Shared!' : 'Challenge sent!'} Your friend will see it on their My Plan page.
              </p>
            ) : (
              <>
                {/* Mode toggle (share vs challenge) */}
                {canChallenge && (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setMode('share')}
                      className={cn(
                        'py-2 rounded text-xs font-semibold transition-colors flex items-center justify-center gap-1.5',
                        mode === 'share'
                          ? 'bg-accent/20 text-accent ring-1 ring-accent/40'
                          : 'bg-elevated text-secondary hover:text-primary'
                      )}
                    >
                      <Share2 className="h-3 w-3" /> Share
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode('challenge')}
                      className={cn(
                        'py-2 rounded text-xs font-semibold transition-colors flex items-center justify-center gap-1.5',
                        mode === 'challenge'
                          ? 'bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/40'
                          : 'bg-elevated text-secondary hover:text-primary'
                      )}
                    >
                      <Swords className="h-3 w-3" /> Challenge
                    </button>
                  </div>
                )}

                {friends.length === 0 ? (
                  <p className="text-muted text-sm">No friends yet. Add friends to share.</p>
                ) : (
                  <div className="space-y-3">
                    <select
                      value={selectedFriend}
                      onChange={(e) => setSelectedFriend(e.target.value)}
                      className="w-full input-field text-sm"
                    >
                      <option value="">Select a friend...</option>
                      {friends.map(f => (
                        <option key={f.friend_id} value={f.friend_id}>
                          {f.display_name}
                        </option>
                      ))}
                    </select>

                    {/* Scoring type for challenges */}
                    {mode === 'challenge' && (
                      <div>
                        <label className="text-xs text-muted block mb-1">How to score?</label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setScoringType('time')}
                            className={cn(
                              'py-1.5 rounded text-xs font-medium transition-colors',
                              scoringType === 'time'
                                ? 'bg-accent/20 text-accent ring-1 ring-accent/40'
                                : 'bg-elevated text-secondary hover:text-primary'
                            )}
                          >
                            Best Time
                          </button>
                          <button
                            type="button"
                            onClick={() => setScoringType('reps')}
                            className={cn(
                              'py-1.5 rounded text-xs font-medium transition-colors',
                              scoringType === 'reps'
                                ? 'bg-accent/20 text-accent ring-1 ring-accent/40'
                                : 'bg-elevated text-secondary hover:text-primary'
                            )}
                          >
                            Most Reps
                          </button>
                        </div>
                      </div>
                    )}

                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={mode === 'challenge' ? 'Think you can beat me?' : 'Check this out! (optional)'}
                      rows={2}
                      className="w-full input-field text-sm resize-none"
                    />

                    {error && <p className="text-red-400 text-xs">{error}</p>}

                    <button
                      onClick={handleSubmit}
                      disabled={!selectedFriend || loading}
                      className="btn-primary w-full py-2 text-sm rounded disabled:opacity-40"
                    >
                      {loading
                        ? (mode === 'challenge' ? 'Sending...' : 'Sharing...')
                        : (mode === 'challenge' ? 'Send Challenge' : 'Share')}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
