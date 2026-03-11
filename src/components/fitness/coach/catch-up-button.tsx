'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FastForward, Loader2 } from 'lucide-react'

interface CatchUpButtonProps {
  planId: string
  planType: 'run' | 'strength'
}

export function CatchUpButton({ planId, planType }: CatchUpButtonProps) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const label = planType === 'run' ? 'Run Plan' : 'Strength Plan'

  async function handleCatchUp() {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/fitness/plans/${planId}/catch-up`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Failed to catch up')
        return
      }

      setConfirming(false)
      router.refresh()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (confirming) {
    return (
      <div className="rounded-lg border border-amber-500/30 bg-surface p-3 space-y-2">
        <p className="text-secondary text-xs">
          This will shift your {label.toLowerCase()} so the next unfinished workout starts today. Your completed workouts stay logged.
        </p>
        {error && <p className="text-red-400 text-xs">{error}</p>}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCatchUp}
            disabled={loading}
            className="btn-primary px-3 py-1.5 text-xs rounded flex items-center gap-1.5 disabled:opacity-40"
          >
            {loading ? (
              <><Loader2 className="h-3 w-3 animate-spin" /> Catching up...</>
            ) : (
              <><FastForward className="h-3 w-3" /> Confirm</>
            )}
          </button>
          <button
            onClick={() => { setConfirming(false); setError(null) }}
            disabled={loading}
            className="text-xs text-muted hover:text-secondary transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="flex items-center gap-1.5 text-xs text-muted hover:text-secondary transition-colors"
    >
      <FastForward className="h-3.5 w-3.5" />
      Catch Up
    </button>
  )
}
