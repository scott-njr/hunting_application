'use client'

import { ClipboardList, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

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

// Scoring constants
const RUN_MAX_PTS = 40
const RUN_BEST_SEC = 720   // 12:00 = max points
const RUN_WORST_SEC = 1440 // 24:00 = 0 points

const PUSHUP_MAX_PTS = 20
const PUSHUP_BEST = 80     // 80+ = max points

const SITUP_MAX_PTS = 20
const SITUP_BEST = 80      // 80+ = max points

const PULLUP_MAX_PTS = 20
const PULLUP_BEST = 25     // 25+ = max points

/** Composite fitness score 0–100 based on all four events */
export function calculateFitnessScore(test: BaselineTest): number {
  // Run: 40 pts max — lower time is better, linear scale
  const runClamped = Math.max(RUN_BEST_SEC, Math.min(RUN_WORST_SEC, test.run_time_seconds))
  const runScore = ((RUN_WORST_SEC - runClamped) / (RUN_WORST_SEC - RUN_BEST_SEC)) * RUN_MAX_PTS

  // Pushups: 20 pts max — linear scale
  const pushupScore = Math.min(1, test.pushups / PUSHUP_BEST) * PUSHUP_MAX_PTS

  // Situps: 20 pts max — linear scale
  const situpScore = Math.min(1, test.situps / SITUP_BEST) * SITUP_MAX_PTS

  // Pullups: 20 pts max — linear scale
  const pullupScore = Math.min(1, test.pullups / PULLUP_BEST) * PULLUP_MAX_PTS

  return Math.round(runScore + pushupScore + situpScore + pullupScore)
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-400'
  if (score >= 60) return 'text-amber-400'
  if (score >= 40) return 'text-orange-400'
  return 'text-red-400'
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

          const score = calculateFitnessScore(test)

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
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="text-right">
                  <div className={cn('font-bold text-lg font-mono leading-tight', getScoreColor(score))}>{score}</div>
                  <div className="text-muted text-[10px] uppercase tracking-wide">Score</div>
                </div>
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
