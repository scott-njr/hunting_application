'use client'

import { cn } from '@/lib/utils'
import { FREQUENCY_BANDS } from './shot-timer-types'

interface BandIndicatorProps {
  bandEnergies: number[]
  /** Per-band thresholds — each band compares against its own threshold */
  thresholds: number[]
}

/** Frequency band activity indicator — shows energy level per band with per-band threshold comparison */
export function BandIndicator({ bandEnergies, thresholds }: BandIndicatorProps) {
  return (
    <div className="flex gap-1">
      {FREQUENCY_BANDS.map((band, i) => {
        const energy = bandEnergies[i] ?? 0
        const threshold = thresholds[i] ?? 100
        const active = energy >= threshold
        const fillPercent = Math.min(100, (energy / 255) * 100)
        return (
          <div key={band.name} className="flex-1 space-y-0.5">
            <div className="relative h-4 bg-elevated rounded-sm overflow-hidden border border-subtle">
              <div
                className={cn('absolute inset-y-0 left-0 rounded-sm', active ? 'bg-red-500' : 'bg-accent/40')}
                style={{ width: `${fillPercent}%` }}
              />
            </div>
            <p className="text-[9px] text-muted text-center truncate">{band.name}</p>
          </div>
        )
      })}
    </div>
  )
}
