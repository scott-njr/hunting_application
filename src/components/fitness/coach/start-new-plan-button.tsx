'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw } from 'lucide-react'

interface StartNewPlanButtonProps {
  planType: 'run' | 'strength' | 'meal'
}

const PLAN_LABELS: Record<string, string> = {
  run: 'Run Plan',
  strength: 'Strength Plan',
  meal: 'Meal Plan',
}

const COACH_ROUTES: Record<string, string> = {
  run: '/fitness/run-coach',
  strength: '/fitness/strength-coach',
  meal: '/fitness/meal-prep',
}

export function StartNewPlanButton({ planType }: StartNewPlanButtonProps) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [abandoning, setAbandoning] = useState(false)

  async function handleAbandon() {
    setAbandoning(true)
    try {
      const res = await fetch(`/api/fitness/plans?type=${planType}`, { method: 'DELETE' })
      if (!res.ok) {
        console.error('Failed to abandon plan')
        return
      }
      setConfirming(false)
      router.push(COACH_ROUTES[planType])
    } finally {
      setAbandoning(false)
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted">Abandon {PLAN_LABELS[planType]}?</span>
        <button
          onClick={handleAbandon}
          disabled={abandoning}
          className="text-xs text-red-400 hover:text-red-300 font-medium"
        >
          {abandoning ? 'Abandoning...' : 'Yes, start over'}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-xs text-muted hover:text-secondary"
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="flex items-center gap-1.5 text-xs text-muted hover:text-secondary transition-colors"
    >
      <RefreshCw className="h-3.5 w-3.5" />
      New {PLAN_LABELS[planType]}
    </button>
  )
}
