'use client'

import { useState, useMemo } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  type CompletedString,
  type CourseScoring,
  type CourseStatus,
  HIT_ZONE_POINTS,
  MISS_PENALTY,
  PROCEDURAL_PENALTY,
} from './shot-timer-types'

interface ScoringModalProps {
  open: boolean
  strings: CompletedString[]
  shotsPerString: number | null
  totalStringsInCourse: number | null
  onSubmit: (scoring: CourseScoring) => void
  onClose: () => void
}

const HIT_ZONES = ['alpha', 'bravo', 'charlie', 'delta', 'miss'] as const
type HitZone = typeof HIT_ZONES[number]

const HIT_ZONE_CONFIG: Record<HitZone, { label: string; points: string; color: string }> = {
  alpha: { label: 'Alpha (A)', points: '5 pts', color: 'text-accent' },
  bravo: { label: 'Bravo (B)', points: '4 pts', color: 'text-primary' },
  charlie: { label: 'Charlie (C)', points: '3 pts', color: 'text-primary' },
  delta: { label: 'Delta (D)', points: '1 pt', color: 'text-primary' },
  miss: { label: 'Miss (M)', points: '-10 pen', color: 'text-red-400' },
}

export function ScoringModal({ open, strings, shotsPerString, totalStringsInCourse, onSubmit, onClose }: ScoringModalProps) {
  // Overall hit zone counts for the entire course
  const [inputs, setInputs] = useState<Record<HitZone, string>>({
    alpha: '',
    bravo: '',
    charlie: '',
    delta: '',
    miss: '',
  })
  const [procedurals, setProcedurals] = useState('')
  const [additionalPenalty, setAdditionalPenalty] = useState('')
  const [isDQ, setIsDQ] = useState(false)
  const [isDNF, setIsDNF] = useState(false)

  const proceduralCount = parseInt(procedurals) || 0
  const additionalPenaltyCount = parseInt(additionalPenalty) || 0

  // Parse input values to numbers
  const counts = useMemo(() => ({
    alpha: parseInt(inputs.alpha) || 0,
    bravo: parseInt(inputs.bravo) || 0,
    charlie: parseInt(inputs.charlie) || 0,
    delta: parseInt(inputs.delta) || 0,
    miss: parseInt(inputs.miss) || 0,
  }), [inputs])

  const totalTime = useMemo(() => {
    return strings.reduce((sum, s) => sum + (s.totalTimeMs || 0), 0)
  }, [strings])

  const totalPoints = useMemo(() => {
    const hitPoints =
      counts.alpha * HIT_ZONE_POINTS.alpha +
      counts.bravo * HIT_ZONE_POINTS.bravo +
      counts.charlie * HIT_ZONE_POINTS.charlie +
      counts.delta * HIT_ZONE_POINTS.delta -
      counts.miss * MISS_PENALTY
    return hitPoints - (proceduralCount * PROCEDURAL_PENALTY) - additionalPenaltyCount
  }, [counts, proceduralCount, additionalPenaltyCount])

  const status: CourseStatus = isDQ ? 'dq' : isDNF ? 'dnf' : 'review'

  // Validation: total shots must equal strings × shotsPerString
  const totalShots = counts.alpha + counts.bravo + counts.charlie + counts.delta + counts.miss
  const requiredShots = (shotsPerString && totalStringsInCourse)
    ? shotsPerString * totalStringsInCourse
    : null
  const shotCountError = requiredShots !== null && totalShots !== requiredShots

  const hitFactor = useMemo(() => {
    if (totalTime <= 0 || isDQ || isDNF) return null
    return totalPoints / (totalTime / 1000)
  }, [totalPoints, totalTime, isDQ, isDNF])

  function updateInput(zone: HitZone, value: string) {
    const cleaned = value.replace(/[^0-9]/g, '')
    setInputs(prev => ({ ...prev, [zone]: cleaned }))
  }

  function handleSubmit() {
    onSubmit({
      alpha: counts.alpha,
      bravo: counts.bravo,
      charlie: counts.charlie,
      delta: counts.delta,
      miss: counts.miss,
      procedurals: proceduralCount,
      additionalPenalty: additionalPenaltyCount,
      status,
      totalPoints,
      totalTime,
      hitFactor,
    })
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-surface border border-subtle rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-surface border-b border-subtle p-4 flex items-center justify-between z-10">
          <h2 className="text-primary font-bold text-base">Course Scoring</h2>
          <button onClick={onClose} className="text-muted hover:text-primary transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-5">
          {/* Hit zone inputs */}
          <div>
            <label className="text-secondary text-xs font-medium block mb-3">
              Hit Zones — Total hits across all targets
            </label>
            <div className="space-y-2.5">
              {HIT_ZONES.map(zone => {
                const config = HIT_ZONE_CONFIG[zone]
                return (
                  <div key={zone} className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <span className={cn('text-sm font-medium', config.color)}>
                        {config.label}
                      </span>
                      <span className="text-muted text-xs ml-1.5">({config.points})</span>
                    </div>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      value={inputs[zone]}
                      onChange={e => updateInput(zone, e.target.value)}
                      className={cn(
                        'w-20 px-3 py-2.5 text-center text-base sm:text-sm font-mono font-bold rounded-lg border bg-elevated text-primary placeholder:text-muted/50 focus:border-accent focus:outline-none',
                        zone === 'miss' ? 'border-red-800/50' : 'border-subtle'
                      )}
                    />
                  </div>
                )
              })}
            </div>

            {/* Shot count validation */}
            <div className={cn(
              'mt-3 px-3 py-2 rounded-lg text-xs font-mono',
              shotCountError
                ? 'bg-red-900/20 border border-red-800/50 text-red-400'
                : 'bg-elevated border border-subtle text-muted'
            )}>
              Total: {totalShots} shots
              {requiredShots !== null && (
                <span>
                  {' '}/ {requiredShots} required
                  <span className="text-secondary ml-1">
                    ({totalStringsInCourse} strings × {shotsPerString} shots)
                  </span>
                </span>
              )}
            </div>
          </div>

          {/* Penalties */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-secondary text-xs font-medium block mb-1">Procedurals</label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={procedurals}
                onChange={e => setProcedurals(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full px-3 py-2.5 bg-elevated border border-subtle rounded-lg text-primary text-base sm:text-sm font-mono placeholder:text-muted/50 focus:border-accent focus:outline-none"
              />
              {proceduralCount > 0 && (
                <p className="text-red-400 text-[10px] mt-1">-{proceduralCount * PROCEDURAL_PENALTY} pts</p>
              )}
            </div>
            <div>
              <label className="text-secondary text-xs font-medium block mb-1">Additional Penalty</label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={additionalPenalty}
                onChange={e => setAdditionalPenalty(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full px-3 py-2.5 bg-elevated border border-subtle rounded-lg text-primary text-base sm:text-sm font-mono placeholder:text-muted/50 focus:border-accent focus:outline-none"
              />
              {additionalPenaltyCount > 0 && (
                <p className="text-red-400 text-[10px] mt-1">-{additionalPenaltyCount} pts</p>
              )}
            </div>
          </div>

          {/* Status checkboxes */}
          <div>
            <label className="text-secondary text-xs font-medium block mb-2">Flags (optional)</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isDQ}
                  onChange={e => { setIsDQ(e.target.checked); if (e.target.checked) setIsDNF(false) }}
                  className="accent-red-500 h-4 w-4"
                />
                <span className={cn('text-sm', isDQ ? 'text-red-400 font-medium' : 'text-secondary')}>
                  DQ — Disqualified
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isDNF}
                  onChange={e => { setIsDNF(e.target.checked); if (e.target.checked) setIsDQ(false) }}
                  className="accent-amber-500 h-4 w-4"
                />
                <span className={cn('text-sm', isDNF ? 'text-amber-400 font-medium' : 'text-secondary')}>
                  DNF — Did Not Finish
                </span>
              </label>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-elevated border border-subtle rounded-lg p-3 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-secondary text-xs">Total Time</span>
              <span className="text-primary font-mono text-sm font-bold">
                {(totalTime / 1000).toFixed(2)}s
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-secondary text-xs">Total Points</span>
              <span className={cn(
                'font-mono text-sm font-bold',
                totalPoints < 0 ? 'text-red-400' : 'text-primary'
              )}>
                {totalPoints}
              </span>
            </div>
            {hitFactor !== null && (
              <div className="flex justify-between items-center">
                <span className="text-secondary text-xs">Hit Factor</span>
                <span className="text-accent font-mono text-sm font-bold">
                  {hitFactor.toFixed(4)}
                </span>
              </div>
            )}
            {(isDQ || isDNF) && (
              <div className="flex justify-between items-center">
                <span className="text-secondary text-xs">Status</span>
                <span className={cn(
                  'text-xs font-bold uppercase',
                  isDQ ? 'text-red-400' : 'text-amber-400'
                )}>
                  {isDQ ? 'Disqualified' : 'Did Not Finish'}
                </span>
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={shotCountError}
            className="w-full px-4 py-2.5 text-sm font-medium bg-accent text-base rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {shotCountError ? 'Fix shot count to submit' : 'Submit Scores'}
          </button>
        </div>
      </div>
    </div>
  )
}
