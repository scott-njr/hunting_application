'use client'

import { useState, useEffect } from 'react'
import { Target } from 'lucide-react'

interface HitFactorInputProps {
  points: number
  hitFactor: number | null
  totalTimeMs: number
  onSetPoints: (points: number) => void
}

/**
 * Points entry for hit factor (points per second) scoring.
 * Standard USPSA/IPSC: HF = total_points / total_time_seconds.
 * Points carry over between strings until changed.
 */
export function HitFactorInput({ points, hitFactor, totalTimeMs, onSetPoints }: HitFactorInputProps) {
  const [inputValue, setInputValue] = useState(points.toString())

  // Sync input with external points changes
  useEffect(() => {
    setInputValue(points.toString())
  }, [points])

  function handleSubmit() {
    const parsed = parseFloat(inputValue)
    if (!isNaN(parsed) && parsed >= 0) {
      onSetPoints(parsed)
    }
  }

  return (
    <div className="bg-elevated border border-subtle rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <Target className="h-4 w-4 text-accent" />
        <h4 className="text-primary font-bold text-sm">Hit Factor Scoring</h4>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Points input */}
        <div>
          <label className="text-muted text-xs block mb-1">Stage Points</label>
          <input
            type="number"
            step="0.1"
            min="0"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onBlur={handleSubmit}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            className="w-full px-3 py-2 bg-surface border border-subtle rounded-lg text-primary text-sm font-mono"
          />
        </div>

        {/* Total time */}
        <div>
          <label className="text-muted text-xs block mb-1">Total Time</label>
          <p className="px-3 py-2 text-secondary text-sm font-mono">
            {totalTimeMs > 0 ? (totalTimeMs / 1000).toFixed(2) + 's' : '—'}
          </p>
        </div>

        {/* Hit Factor */}
        <div>
          <label className="text-muted text-xs block mb-1">Hit Factor</label>
          <p className="px-3 py-2 text-accent font-bold text-sm font-mono">
            {hitFactor !== null ? hitFactor.toFixed(4) : '—'}
          </p>
        </div>
      </div>

      <p className="text-muted text-xs mt-2">
        Points carry over between strings until changed.
      </p>
    </div>
  )
}
