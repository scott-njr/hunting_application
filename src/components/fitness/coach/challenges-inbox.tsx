'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Swords, Check, X, Trophy, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChallengeSubmission {
  score_value: number
  score_display: string
  scaling: 'rx' | 'scaled' | 'beginner'
  notes: string | null
}

interface Challenge {
  id: string
  challenger_id: string
  challenged_id: string
  item_type: 'run_session' | 'strength_session'
  item_snapshot: Record<string, unknown>
  status: 'pending' | 'accepted' | 'declined' | 'completed'
  scoring_type: 'time' | 'reps'
  message: string | null
  direction: 'sent' | 'received'
  partner_name: string
  my_submission: ChallengeSubmission | null
  opponent_submission: ChallengeSubmission | null
  created_on: string
}

export function ChallengesInbox() {
  const router = useRouter()
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [responding, setResponding] = useState<string | null>(null)
  const [respondError, setRespondError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [submitChallengeId, setSubmitChallengeId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/fitness/challenges')
      .then(r => { if (!r.ok) return { challenges: [] }; return r.json() })
      .then(d => setChallenges(d.challenges ?? []))
  }, [])

  async function respond(challengeId: string, action: 'accept' | 'decline') {
    setResponding(challengeId)
    try {
      const res = await fetch('/api/fitness/challenges/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challenge_id: challengeId, action }),
      })
      if (res.ok) {
        if (action === 'decline') {
          setChallenges(prev => prev.filter(c => c.id !== challengeId))
        } else {
          setChallenges(prev => prev.map(c =>
            c.id === challengeId ? { ...c, status: 'accepted' } : c
          ))
        }
        router.refresh()
      } else {
        setRespondError(`Failed to ${action} challenge`)
      }
    } catch {
      setRespondError('Network error — please try again')
    } finally {
      setResponding(null)
    }
  }

  const pending = challenges.filter(c => c.status === 'pending' && c.direction === 'received')
  const active = challenges.filter(c => c.status === 'accepted')
  const completed = challenges.filter(c => c.status === 'completed')
  const sentPending = challenges.filter(c => c.status === 'pending' && c.direction === 'sent')

  if (challenges.length === 0) return null

  return (
    <div className="space-y-3">
      <h3 className="text-xs text-muted uppercase font-medium tracking-wide flex items-center gap-1.5">
        <Swords className="h-3.5 w-3.5" /> Challenges
      </h3>

      {respondError && (
        <div className="p-3 rounded bg-red-950/50 border border-red-500/30 text-red-400 text-xs">
          {respondError}
        </div>
      )}

      {/* Pending incoming */}
      {pending.map(c => (
        <PendingChallengeCard
          key={c.id}
          challenge={c}
          responding={responding === c.id}
          onRespond={(action) => respond(c.id, action)}
        />
      ))}

      {/* Sent pending */}
      {sentPending.map(c => (
        <div key={c.id} className="rounded-lg border border-subtle bg-surface p-4">
          <div className="flex items-center gap-3">
            <Swords className="h-4 w-4 text-amber-400 flex-shrink-0" />
            <div>
              <p className="text-primary text-sm">
                Challenge sent to <span className="font-medium">{c.partner_name}</span>
              </p>
              <p className="text-muted text-xs">{(c.item_snapshot.title as string) ?? 'Workout'} &middot; Waiting for response</p>
            </div>
          </div>
        </div>
      ))}

      {/* Active challenges */}
      {active.map(c => (
        <ActiveChallengeCard
          key={c.id}
          challenge={c}
          expanded={expandedId === c.id}
          onToggle={() => setExpandedId(expandedId === c.id ? null : c.id)}
          showSubmit={submitChallengeId === c.id}
          onToggleSubmit={() => setSubmitChallengeId(submitChallengeId === c.id ? null : c.id)}
          onSubmitted={(updated) => {
            setChallenges(prev => prev.map(ch => ch.id === updated.id ? updated : ch))
            setSubmitChallengeId(null)
            router.refresh()
          }}
        />
      ))}

      {/* Completed challenges */}
      {completed.map(c => (
        <CompletedChallengeCard key={c.id} challenge={c} />
      ))}
    </div>
  )
}

function PendingChallengeCard({
  challenge: c,
  responding,
  onRespond,
}: {
  challenge: Challenge
  responding: boolean
  onRespond: (action: 'accept' | 'decline') => void
}) {
  return (
    <div className="rounded-lg border border-amber-500/30 bg-surface p-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <Swords className="h-4 w-4 text-amber-400 flex-shrink-0" />
        <div className="min-w-0">
          <p className="text-primary text-sm">
            <span className="font-medium">{c.partner_name}</span> challenges you!
          </p>
          <p className="text-secondary text-xs truncate">
            {(c.item_snapshot.title as string) ?? 'Workout'} &middot; {c.scoring_type === 'time' ? 'Best Time' : 'Most Reps'}
          </p>
          {c.message && <p className="text-muted text-xs italic mt-0.5">&ldquo;{c.message}&rdquo;</p>}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={() => onRespond('accept')}
          disabled={responding}
          className="btn-primary px-3 py-1.5 text-xs rounded flex items-center gap-1 disabled:opacity-40"
        >
          <Check className="h-3 w-3" /> Accept
        </button>
        <button
          onClick={() => onRespond('decline')}
          disabled={responding}
          className="px-3 py-1.5 text-xs rounded border border-subtle text-muted hover:text-secondary hover:border-default transition-colors disabled:opacity-40"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    </div>
  )
}

function ActiveChallengeCard({
  challenge: c,
  expanded,
  onToggle,
  showSubmit,
  onToggleSubmit,
  onSubmitted,
}: {
  challenge: Challenge
  expanded: boolean
  onToggle: () => void
  showSubmit: boolean
  onToggleSubmit: () => void
  onSubmitted: (updated: Challenge) => void
}) {
  return (
    <div className="rounded-lg border border-accent/30 bg-surface p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Swords className="h-4 w-4 text-accent flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-primary text-sm">
              Challenge vs <span className="font-medium">{c.partner_name}</span>
            </p>
            <p className="text-secondary text-xs truncate">
              {(c.item_snapshot.title as string) ?? 'Workout'} &middot; {c.scoring_type === 'time' ? 'Best Time' : 'Most Reps'}
            </p>
            <div className="flex gap-3 mt-1 text-xs">
              <span className={c.my_submission ? 'text-green-400' : 'text-amber-400'}>
                You: {c.my_submission ? c.my_submission.score_display : 'Not submitted'}
              </span>
              <span className={c.opponent_submission ? 'text-green-400' : 'text-muted'}>
                {c.partner_name}: {c.opponent_submission ? c.opponent_submission.score_display : 'Pending'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {!c.my_submission && (
            <button
              onClick={onToggleSubmit}
              className="btn-primary px-3 py-1.5 text-xs rounded"
            >
              Submit Score
            </button>
          )}
          <button onClick={onToggle} className="text-muted hover:text-secondary p-2 min-h-[44px] min-w-[44px] flex items-center justify-center">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {expanded && (() => {
        const snap = c.item_snapshot as Record<string, unknown>
        const desc = snap.description as string | undefined
        return desc ? (
          <div className="mt-3 pt-3 border-t border-subtle text-sm space-y-2">
            <p className="text-secondary text-xs">{desc}</p>
          </div>
        ) : null
      })()}

      {showSubmit && (
        <ChallengeScoreForm
          challengeId={c.id}
          scoringType={c.scoring_type}
          existing={c.my_submission}
          onSubmitted={(sub) => {
            onSubmitted({ ...c, my_submission: sub })
          }}
        />
      )}
    </div>
  )
}

function CompletedChallengeCard({ challenge: c }: { challenge: Challenge }) {
  const myScore = c.my_submission?.score_value ?? 0
  const theirScore = c.opponent_submission?.score_value ?? 0

  let iWon: boolean
  if (c.scoring_type === 'time') {
    iWon = myScore < theirScore // Lower time wins
  } else {
    iWon = myScore > theirScore // Higher reps wins
  }
  const isTie = myScore === theirScore

  return (
    <div className="rounded-lg border border-subtle bg-surface p-4">
      <div className="flex items-center gap-3">
        <Trophy className={cn('h-4 w-4 flex-shrink-0', isTie ? 'text-muted' : iWon ? 'text-amber-400' : 'text-muted')} />
        <div className="min-w-0">
          <p className="text-primary text-sm">
            {isTie ? 'Tie!' : iWon ? 'You won!' : `${c.partner_name} won!`}
            {' '}
            <span className="text-muted font-normal">&middot; {(c.item_snapshot.title as string) ?? 'Workout'}</span>
          </p>
          <div className="flex gap-3 mt-0.5 text-xs">
            <span className={cn(iWon && !isTie ? 'text-amber-400 font-medium' : 'text-secondary')}>
              You: {c.my_submission?.score_display ?? '—'}
            </span>
            <span className={cn(!iWon && !isTie ? 'text-amber-400 font-medium' : 'text-secondary')}>
              {c.partner_name}: {c.opponent_submission?.score_display ?? '—'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function ChallengeScoreForm({
  challengeId,
  scoringType,
  existing,
  onSubmitted,
}: {
  challengeId: string
  scoringType: 'time' | 'reps'
  existing: ChallengeSubmission | null
  onSubmitted: (sub: ChallengeSubmission) => void
}) {
  const [scaling, setScaling] = useState<'rx' | 'scaled' | 'beginner'>(existing?.scaling ?? 'scaled')
  const [scoreDisplay, setScoreDisplay] = useState(existing?.score_display ?? '')
  const [notes, setNotes] = useState(existing?.notes ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function parseScoreValue(display: string): number | null {
    if (scoringType === 'time') {
      const match = display.match(/^(\d{1,3}):(\d{2})$/)
      if (!match) return null
      return parseInt(match[1]) * 60 + parseInt(match[2])
    }
    const num = parseInt(display)
    return isNaN(num) ? null : num
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const scoreValue = parseScoreValue(scoreDisplay)
    if (scoreValue === null) {
      setError(scoringType === 'time' ? 'Enter time as MM:SS (e.g. 32:15)' : 'Enter a valid number')
      return
    }

    setSaving(true)
    try {
      const res = await fetch(`/api/fitness/challenges/${challengeId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score_value: scoreValue,
          score_display: scoreDisplay,
          scaling,
          notes: notes || null,
        }),
      })

      if (res.ok) {
        onSubmitted({ score_value: scoreValue, score_display: scoreDisplay, scaling, notes: notes || null })
      } else {
        const data = await res.json().catch(() => null)
        setError(data?.error ?? 'Failed to submit')
      }
    } catch {
      setError('Network error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mt-3 pt-3 border-t border-subtle">
      {error && <p className="text-red-400 text-xs mb-2">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          {(['rx', 'scaled', 'beginner'] as const).map(s => (
            <button
              key={s}
              type="button"
              onClick={() => setScaling(s)}
              className={cn(
                'py-2.5 rounded text-xs font-semibold transition-colors',
                scaling === s
                  ? s === 'rx' ? 'bg-green-500/20 text-green-400 ring-1 ring-green-500/40' :
                    s === 'scaled' ? 'bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/40' :
                    'bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/40'
                  : 'bg-elevated text-secondary hover:text-primary'
              )}
            >
              {s === 'rx' ? 'RX' : s === 'scaled' ? 'Scaled' : 'Beginner'}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={scoreDisplay}
          onChange={e => setScoreDisplay(e.target.value)}
          placeholder={scoringType === 'time' ? 'MM:SS (e.g. 32:15)' : 'Total reps'}
          className="w-full input-field text-sm font-mono"
          required
        />
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Notes (optional)"
          rows={1}
          className="w-full input-field text-sm resize-none"
        />
        <button
          type="submit"
          disabled={saving || !scoreDisplay}
          className="btn-primary w-full py-2 text-sm rounded disabled:opacity-40"
        >
          {saving ? 'Submitting...' : existing ? 'Update Score' : 'Submit Score'}
        </button>
      </form>
    </div>
  )
}
