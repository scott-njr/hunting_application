'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sliders, Loader2 } from 'lucide-react'
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
  const [error, setError] = useState<string | null>(null)

  const label = planType ? PLAN_LABELS[planType] : 'Plan'
  const steps = planType ? PROGRESS_STEPS[planType] : PROGRESS_STEPS.run

  async function handleAdjust() {
    if (!feedback.trim()) return
    setAdjusting(true)
    setError(null)

    const res = await fetch(`/api/fitness/plans/${planId}/adjust`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feedback: feedback.trim() }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Failed to adjust plan')
      setAdjusting(false)
      return
    }

    setAdjusting(false)
    setOpen(false)
    setFeedback('')
    router.refresh()
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
            'Apply Changes'
          )}
        </button>
        <button
          onClick={() => { setOpen(false); setFeedback(''); setError(null) }}
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
