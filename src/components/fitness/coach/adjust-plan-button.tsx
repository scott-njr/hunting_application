'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sliders, Loader2, Check, X, RefreshCw } from 'lucide-react'
import { AIProgressModal } from '@/components/ui/ai-progress-modal'

interface AdjustPlanButtonProps {
  planId: string
  planType?: 'run' | 'strength' | 'meal'
}

const PLAN_LABELS: Record<string, string> = {
  run: 'Run Plan',
  strength: 'Strength Plan',
  meal: 'Meal Plan',
}

const PROGRESS_STEPS: Record<string, string[]> = {
  run: ['Reading your feedback…', 'Adjusting mileage…', 'Recalculating sessions…', 'Finalizing run plan…'],
  strength: ['Reading your feedback…', 'Adjusting exercises…', 'Recalculating sets & reps…', 'Finalizing strength plan…'],
  meal: ['Reading your feedback…', 'Adjusting meals…', 'Recalculating macros…', 'Finalizing meal plan…'],
}

export function AdjustPlanButton({ planId, planType }: AdjustPlanButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [adjusting, setAdjusting] = useState(false)
  const [accepting, setAccepting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Draft state — holds the AI-generated adjustment for preview
  const [draft, setDraft] = useState<Record<string, unknown> | null>(null)
  const [draftGoal, setDraftGoal] = useState<string | null>(null)

  const label = planType ? PLAN_LABELS[planType] : 'Plan'
  const steps = planType ? PROGRESS_STEPS[planType] : PROGRESS_STEPS.run

  async function handleAdjust() {
    if (!feedback.trim()) return
    setAdjusting(true)
    setError(null)

    try {
      const res = await fetch(`/api/fitness/plans/${planId}/adjust`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback: feedback.trim() }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Failed to adjust plan')
        return
      }

      // Store draft for preview — not saved yet
      setDraft(data.draft)
      setDraftGoal(data.goal ?? null)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setAdjusting(false)
    }
  }

  async function handleAccept() {
    if (!draft) return
    setAccepting(true)
    setError(null)

    try {
      const res = await fetch(`/api/fitness/plans/${planId}/accept-adjustment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draft, goal: draftGoal }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Failed to save adjustment')
        return
      }

      // Success — close everything and refresh
      resetState()
      router.refresh()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setAccepting(false)
    }
  }

  function handleReject() {
    // Discard draft, go back to closed state
    resetState()
  }

  function handleAdjustAgain() {
    // Keep the form open but clear the draft so user can give new feedback
    setDraft(null)
    setDraftGoal(null)
    setFeedback('')
    setError(null)
  }

  function resetState() {
    setOpen(false)
    setFeedback('')
    setError(null)
    setDraft(null)
    setDraftGoal(null)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs text-muted hover:text-secondary transition-colors"
      >
        <Sliders className="h-3.5 w-3.5" />
        Adjust {label}
      </button>
    )
  }

  // Draft preview mode — show summary with accept/reject/adjust-again
  if (draft) {
    return (
      <div className="rounded-lg border border-accent/30 bg-surface p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Sliders className="h-4 w-4 text-accent" />
          <h3 className="text-primary font-medium text-sm">Proposed {label} Adjustment</h3>
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}

        {draftGoal && (
          <p className="text-secondary text-sm">{draftGoal}</p>
        )}

        <DraftSummary draft={draft} planType={planType} />

        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={handleAccept}
            disabled={accepting}
            className="btn-primary px-4 py-1.5 text-sm disabled:opacity-40 rounded flex items-center gap-1.5"
          >
            {accepting ? (
              <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...</>
            ) : (
              <><Check className="h-3.5 w-3.5" /> Accept</>
            )}
          </button>
          <button
            onClick={handleAdjustAgain}
            disabled={accepting}
            className="px-4 py-1.5 text-sm rounded border border-subtle text-secondary hover:text-primary hover:border-default transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Adjust Again
          </button>
          <button
            onClick={handleReject}
            disabled={accepting}
            className="text-xs text-muted hover:text-secondary transition-colors flex items-center gap-1.5 ml-auto"
          >
            <X className="h-3.5 w-3.5" /> Discard
          </button>
        </div>
      </div>
    )
  }

  // Feedback input mode
  return (
    <>
    <AIProgressModal
      open={adjusting}
      featureLabel={`${label} Adjustment`}
      steps={steps}
    />
    <div className="rounded-lg border border-subtle bg-surface p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Sliders className="h-4 w-4 text-accent" />
        <h3 className="text-primary font-medium text-sm">Adjust {label}</h3>
      </div>

      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}

      <textarea
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        className="w-full input-field resize-none text-sm"
        rows={2}
        placeholder={
          planType === 'meal'
            ? 'e.g., "Fewer carbs", "More variety", "Cheaper ingredients"'
            : planType === 'strength'
            ? 'e.g., "More upper body", "Less volume", "Add core work"'
            : 'e.g., "Make it harder", "Less running, more intervals", "More rest days"'
        }
        autoFocus
      />

      <div className="flex items-center gap-2">
        <button
          onClick={handleAdjust}
          disabled={adjusting || !feedback.trim()}
          className="btn-primary px-4 py-1.5 text-sm disabled:opacity-40 rounded"
        >
          {adjusting ? (
            <span className="flex items-center gap-1.5">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Adjusting...
            </span>
          ) : (
            'Generate Preview'
          )}
        </button>
        <button
          onClick={resetState}
          className="text-xs text-muted hover:text-secondary transition-colors"
        >
          Cancel
        </button>
      </div>

      {adjusting && (
        <p className="text-muted text-xs">
          AI is adjusting your {label.toLowerCase()}. This may take 10–15 seconds.
        </p>
      )}
    </div>
    </>
  )
}

/** Compact summary of what changed in the draft */
function DraftSummary({ draft, planType }: { draft: Record<string, unknown>; planType?: string }) {
  if (planType === 'meal') {
    const days = (draft.days ?? []) as Array<Record<string, unknown>>
    const totalMeals = days.reduce((sum, d) => {
      const meals = (d.meals ?? []) as unknown[]
      return sum + meals.length
    }, 0)
    return (
      <div className="text-xs text-muted space-y-1 bg-elevated rounded p-3">
        <p>{days.length} days &middot; {totalMeals} meals total</p>
        {days.slice(0, 3).map((d, i) => {
          const dayLabel = (d.day as string) ?? `Day ${i + 1}`
          const meals = (d.meals ?? []) as Array<Record<string, unknown>>
          const names = meals.map(m => (m.title as string) ?? (m.name as string) ?? '?').join(', ')
          return <p key={i} className="text-secondary truncate"><span className="text-muted">{dayLabel}:</span> {names}</p>
        })}
        {days.length > 3 && <p className="text-muted italic">+{days.length - 3} more days</p>}
      </div>
    )
  }

  // Run or strength plan
  const weeks = (draft.weeks ?? []) as Array<Record<string, unknown>>
  return (
    <div className="text-xs text-muted space-y-1 bg-elevated rounded p-3">
      <p>{weeks.length} weeks</p>
      {weeks.slice(0, 4).map((w, i) => {
        const weekLabel = (w.week_label as string) ?? `Week ${i + 1}`
        const sessions = (w.sessions ?? []) as Array<Record<string, unknown>>
        const focus = (w.focus as string) ?? (w.theme as string)
        const sessionCount = sessions.length
        return (
          <p key={i} className="text-secondary truncate">
            <span className="text-muted">{weekLabel}:</span>{' '}
            {sessionCount} sessions{focus ? ` — ${focus}` : ''}
          </p>
        )
      })}
      {weeks.length > 4 && <p className="text-muted italic">+{weeks.length - 4} more weeks</p>}
    </div>
  )
}
