'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RotateCcw, Loader2 } from 'lucide-react'

const PLAN_TYPE_LABELS: Record<string, string> = { run: 'run', strength: 'strength', meal: 'meal' }

export function RevertButtonInline({ planId, planType }: { planId: string; planType: string }) {
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
      setConfirming(false)
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-amber-400 text-xs">Revert to this {PLAN_TYPE_LABELS[planType] ?? ''} plan?</span>
        <button
          onClick={handleRevert}
          disabled={reverting}
          className="btn-primary px-3 py-1 text-xs rounded flex items-center gap-1 disabled:opacity-40"
        >
          {reverting ? <><Loader2 className="h-3 w-3 animate-spin" /> Reverting...</> : 'Confirm'}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-xs text-muted hover:text-secondary transition-colors"
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
      <RotateCcw className="h-3.5 w-3.5" /> Revert
    </button>
  )
}
