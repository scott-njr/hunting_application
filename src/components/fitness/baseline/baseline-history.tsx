'use client'

import { ClipboardList, TrendingUp, TrendingDown, Minus } from 'lucide-react'

export interface BaselineTest {
  id: string
  run_time_seconds: number
  pushups: number
  situps: number
  pullups: number
  notes: string | null
  tested_at: string
}

function formatRunTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

/** Calculate overall progression: compare 4 metrics, majority wins */
function getProgression(current: BaselineTest, previous: BaselineTest): 'up' | 'down' | 'same' {
  let improved = 0
  let regressed = 0

  // Run time: lower is better
  if (current.run_time_seconds < previous.run_time_seconds) improved++
  else if (current.run_time_seconds > previous.run_time_seconds) regressed++

  // Pushups, situps, pullups: higher is better
  if (current.pushups > previous.pushups) improved++
  else if (current.pushups < previous.pushups) regressed++

  if (current.situps > previous.situps) improved++
  else if (current.situps < previous.situps) regressed++

  if (current.pullups > previous.pullups) improved++
  else if (current.pullups < previous.pullups) regressed++

  if (improved > regressed) return 'up'
  if (regressed > improved) return 'down'
  return 'same'
}

export function BaselineHistory({ tests }: { tests: BaselineTest[] }) {
  if (tests.length === 0) return null

  const recent = tests.slice(0, 3)

  return (
    <div className="rounded-lg border border-subtle bg-surface p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-accent" />
          <h2 className="text-primary font-bold text-lg">Test History</h2>
        </div>
        {tests.length > 3 && (
          <span className="text-muted text-xs">Last 3 of {tests.length}</span>
        )}
      </div>

      <div className="space-y-3">
        {recent.map((test, i) => {
          // Find previous test: next in array (older), or from full tests array for context
          const prev = i + 1 < tests.length ? tests[i + 1] : null
          const progression = prev ? getProgression(test, prev) : null

          return (
            <div key={test.id} className="flex items-center gap-3 rounded bg-elevated p-3 border border-subtle">
              <div className="flex-1 min-w-0">
                <div className="text-secondary text-xs mb-1">
                  {new Date(test.tested_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-primary font-mono">{formatRunTime(test.run_time_seconds)}</span>
                  <span className="text-muted">|</span>
                  <span className="text-primary">{test.pushups} PU</span>
                  <span className="text-primary">{test.situps} SU</span>
                  <span className="text-primary">{test.pullups} PL</span>
                </div>
              </div>
              <div className="flex-shrink-0">
                {progression === 'up' && (
                  <div className="flex items-center gap-1 text-green-400">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                )}
                {progression === 'down' && (
                  <div className="flex items-center gap-1 text-red-400">
                    <TrendingDown className="h-5 w-5" />
                  </div>
                )}
                {progression === 'same' && (
                  <div className="flex items-center gap-1 text-muted">
                    <Minus className="h-5 w-5" />
                  </div>
                )}
                {progression === null && (
                  <span className="text-muted text-xs">First</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
