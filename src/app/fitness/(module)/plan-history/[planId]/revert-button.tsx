'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RotateCcw } from 'lucide-react'

const PLAN_TYPE_LABELS: Record<string, string> = { run: 'run', strength: 'strength', meal: 'meal' }

export function RevertButton({ planId, planType }: { planId: string; planType: string }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [reverting, setReverting] = useState(false)

  async function handleRevert() {
    setReverting(true)
    try {
      const res = await fetch('/api/fitness/plans/revert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan_id: planId }),
      })
      if (res.ok) {
        router.push('/fitness/my-plan')
        router.refresh()
      }
    } catch (err) {
      console.error('Failed to revert:', err)
    } finally {
      setReverting(false)
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-amber-400 text-xs">Revert to this {PLAN_TYPE_LABELS[planType] ?? ''} plan?</span>
        <button
          onClick={handleRevert}
          disabled={reverting}
          className="btn-primary px-3 py-1.5 text-xs rounded disabled:opacity-40"
        >
          {reverting ? 'Reverting...' : 'Confirm'}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="px-3 py-1.5 text-xs rounded border border-subtle text-muted hover:text-secondary"
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="flex items-center gap-1.5 text-sm text-muted hover:text-secondary transition-colors"
    >
      <RotateCcw className="h-4 w-4" /> Revert to This Plan
    </button>
  )
}
