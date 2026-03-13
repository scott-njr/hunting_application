'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Clock, Dumbbell, Target, Send, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SCALING_BADGE, SCALING_ACTIVE_RING, WOW_DISCLAIMER } from '@/lib/fitness/constants'
import type { ScalingLevel } from '@/lib/fitness/constants'
import { AlertBanner } from '@/components/ui/alert-banner'
import type { Workout } from './wow-card'

type ExistingSubmission = {
  scaling: 'rx' | 'scaled' | 'beginner'
  score_value: number
  score_display: string
  notes: string | null
} | null

interface WowChallengeCardProps {
  workout: Workout
  scoringType: 'time' | 'amrap'
  existing: ExistingSubmission
}

const SCALING_LEVELS: ScalingLevel[] = ['rx', 'scaled', 'beginner']

export function WowChallengeCard({ workout, scoringType, existing }: WowChallengeCardProps) {
  const router = useRouter()
  const details = workout.workout_details

  const [scaling, setScaling] = useState<ScalingLevel>(existing?.scaling ?? 'scaled')
  const [scoreDisplay, setScoreDisplay] = useState(existing?.score_display ?? '')
  const [notes, setNotes] = useState(existing?.notes ?? '')
  const [saving, setSaving] = useState(false)
  const [submitted, setSubmitted] = useState(!!existing)
  const [error, setError] = useState<string | null>(null)

  const selectedScale = details.scaling[scaling]

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
      const res = await fetch('/api/fitness/wow/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workout_id: workout.id,
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
    <div className="rounded-lg border border-subtle bg-surface">
      <div className="p-5">
        {/* Header */}
        <p className="text-xs font-semibold uppercase tracking-wide text-green-400 mb-1">
          Workout of the Week
        </p>
        <h3 className="text-xl font-bold text-primary mb-2">{workout.title}</h3>
        <p className="text-secondary text-sm mb-4">{workout.description}</p>

        {/* Meta badges */}
        <div className="flex flex-wrap gap-2 mb-5">
          <span className="inline-flex items-center gap-1.5 text-xs bg-elevated rounded-full px-3 py-1 text-secondary">
            <Clock className="h-3.5 w-3.5" />
            {details.duration}
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs bg-elevated rounded-full px-3 py-1 text-secondary">
            <Target className="h-3.5 w-3.5" />
            {details.scoring === 'time' ? 'For Time' : `AMRAP ${details.time_cap_minutes ?? ''}min`}
          </span>
          {details.equipment.map(eq => (
            <span key={eq} className="inline-flex items-center gap-1.5 text-xs bg-elevated rounded-full px-3 py-1 text-secondary">
              <Dumbbell className="h-3.5 w-3.5" />
              {eq}
            </span>
          ))}
        </div>

        {/* Scaling tab selector */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {SCALING_LEVELS.map(s => (
            <button
              key={s}
              type="button"
              onClick={() => setScaling(s)}
              className={cn(
                'py-3 rounded text-xs font-semibold transition-colors min-h-[44px]',
                scaling === s
                  ? `${SCALING_BADGE[s].className} ${SCALING_ACTIVE_RING[s]}`
                  : 'bg-elevated text-secondary hover:text-primary'
              )}
            >
              {SCALING_BADGE[s].label}
            </button>
          ))}
        </div>

        {/* Selected scaling movements */}
        <div className="rounded-lg border border-subtle bg-elevated/50 p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className={cn('text-xs font-bold uppercase px-2 py-0.5 rounded', SCALING_BADGE[scaling].className)}>
              {selectedScale.label}
            </span>
            <span className="text-muted text-xs">{selectedScale.description}</span>
          </div>
          <div className="space-y-1.5">
            {selectedScale.movements.map((mv, i) => (
              <div key={i} className="flex items-baseline gap-2 text-sm">
                <span className="text-primary font-medium">{mv.reps}</span>
                <span className="text-secondary">{mv.name}</span>
                {mv.notes && <span className="text-muted text-xs">— {mv.notes}</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Warmup / Cooldown */}
        <div className="grid grid-cols-2 gap-3 mb-5 pb-5 border-b border-subtle">
          <div>
            <p className="text-xs font-semibold text-muted uppercase mb-1">Warm-up</p>
            <p className="text-secondary text-xs">{details.warmup}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted uppercase mb-1">Cool-down</p>
            <p className="text-secondary text-xs">{details.cooldown}</p>
          </div>
        </div>

        {/* Submit section */}
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

        {error && <AlertBanner variant="error" message={error} className="mb-4" />}

        <form onSubmit={handleSubmit} className="space-y-4">
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
              className="w-full bg-elevated border border-subtle rounded px-3 py-2 text-primary text-base sm:text-sm
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
              className="w-full bg-elevated border border-subtle rounded px-3 py-2 text-primary text-base sm:text-sm
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

        <p className="text-muted text-xs italic mt-4">
          {WOW_DISCLAIMER}
        </p>
      </div>
    </div>
  )
}
