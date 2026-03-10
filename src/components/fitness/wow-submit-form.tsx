'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Send, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

type ExistingSubmission = {
  scaling: 'rx' | 'scaled' | 'beginner'
  score_value: number
  score_display: string
  notes: string | null
} | null

interface WowSubmitFormProps {
  workoutId: string
  scoringType: 'time' | 'amrap'
  existing: ExistingSubmission
}

export function WowSubmitForm({ workoutId, scoringType, existing }: WowSubmitFormProps) {
  const router = useRouter()
  const [scaling, setScaling] = useState<'rx' | 'scaled' | 'beginner'>(existing?.scaling ?? 'scaled')
  const [scoreDisplay, setScoreDisplay] = useState(existing?.score_display ?? '')
  const [notes, setNotes] = useState(existing?.notes ?? '')
  const [saving, setSaving] = useState(false)
  const [submitted, setSubmitted] = useState(!!existing)
  const [error, setError] = useState<string | null>(null)

  function parseScoreValue(display: string): number | null {
    if (scoringType === 'time') {
      // Parse "MM:SS" or "M:SS" into seconds
      const match = display.match(/^(\d{1,3}):(\d{2})$/)
      if (!match) return null
      return parseInt(match[1]) * 60 + parseInt(match[2])
    }
    // AMRAP: parse integer (total reps or rounds)
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
      const res = await fetch('/api/fitness/wow/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workout_id: workoutId,
          scaling,
          score_value: scoreValue,
          score_display: scoreDisplay,
          notes: notes || null,
        }),
      })

      if (res.ok) {
        setSubmitted(true)
        router.refresh()
      } else {
        const data = await res.json().catch(() => null)
        setError(data?.error ?? 'Failed to submit score. Please try again.')
      }
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-lg border border-subtle bg-surface p-5">
      <div className="flex items-center gap-2 mb-4">
        {submitted ? (
          <CheckCircle className="h-4 w-4 text-green-400" />
        ) : (
          <Send className="h-4 w-4 text-accent" />
        )}
        <h3 className="text-primary font-semibold text-sm">
          {submitted ? 'Score Submitted' : 'Submit Your Score'}
        </h3>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded bg-red-950/50 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Scaling selector */}
        <div>
          <label className="text-xs font-medium text-muted uppercase tracking-wide mb-2 block">
            Scaling Level
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {(['rx', 'scaled', 'beginner'] as const).map(s => (
              <button
                key={s}
                type="button"
                onClick={() => setScaling(s)}
                className={cn(
                  'py-2 rounded text-xs font-semibold transition-colors',
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
        </div>

        {/* Score input */}
        <div>
          <label className="text-xs font-medium text-muted uppercase tracking-wide mb-2 block">
            {scoringType === 'time' ? 'Time (MM:SS)' : 'Total Reps / Rounds'}
          </label>
          <input
            type="text"
            value={scoreDisplay}
            onChange={e => setScoreDisplay(e.target.value)}
            placeholder={scoringType === 'time' ? '32:15' : '185'}
            className="w-full bg-elevated border border-subtle rounded px-3 py-2 text-primary text-sm
                       placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent font-mono"
            required
          />
        </div>

        {/* Notes */}
        <div>
          <label className="text-xs font-medium text-muted uppercase tracking-wide mb-2 block">
            Notes (optional)
          </label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="How did it go? Any modifications?"
            rows={2}
            className="w-full bg-elevated border border-subtle rounded px-3 py-2 text-primary text-sm
                       placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={saving || !scoreDisplay}
          className={cn(
            'w-full py-2.5 rounded text-sm font-semibold transition-colors',
            saving || !scoreDisplay
              ? 'bg-elevated text-muted cursor-not-allowed'
              : 'btn-primary'
          )}
        >
          {saving ? 'Submitting...' : submitted ? 'Update Score' : 'Submit Score'}
        </button>
      </form>
    </div>
  )
}
