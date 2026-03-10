'use client'

import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'

export function ActualCostCard() {
  const [cost, setCost] = useState<number | null>(null)
  const [projected, setProjected] = useState<number | null>(null)
  const [source, setSource] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/ai-cost')
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error)
        } else {
          setCost(data.actualCost)
          setProjected(data.projectedCost)
          setSource(data.source)
        }
      })
      .catch(() => setError('Failed to fetch'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <div className="rounded-lg border border-subtle bg-surface p-5">
        <p className="text-muted text-[10px] font-semibold uppercase tracking-wider mb-2">Actual Cost</p>
        {loading ? (
          <Loader2 className="h-6 w-6 text-muted animate-spin mt-2" />
        ) : error ? (
          <p className="text-red-400 text-xs mt-2">{error}</p>
        ) : (
          <>
            <p className="text-primary text-3xl font-bold">${(cost ?? 0).toFixed(2)}</p>
            <p className="text-muted text-xs mt-1">{source === 'console' ? 'from Claude Console' : 'from token usage'}</p>
          </>
        )}
      </div>
      <div className="rounded-lg border border-subtle bg-surface p-5">
        <p className="text-muted text-[10px] font-semibold uppercase tracking-wider mb-2">Projected Cost</p>
        {loading ? (
          <Loader2 className="h-6 w-6 text-muted animate-spin mt-2" />
        ) : error ? (
          <p className="text-muted text-xs mt-2">—</p>
        ) : (
          <>
            <p className="text-primary text-3xl font-bold">${(projected ?? 0).toFixed(2)}</p>
            <p className="text-muted text-xs mt-1">end of month</p>
          </>
        )}
      </div>
    </>
  )
}
