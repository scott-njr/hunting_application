'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, ChevronUp, Check, Minus, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Session {
  session_number: number
  title: string
  type: string
  description?: string
  distance_miles?: number
  duration_min?: number
  effort_level?: string
  exercises?: Array<{ name: string; sets: number; reps: string; notes?: string }>
  warmup?: string
  cooldown?: string
}

interface WeekData {
  week_number: number
  theme?: string
  focus?: string
  sessions: Session[]
}

interface WeekComparison {
  week_number: number
  current: WeekData | null
  previous: WeekData | null
  currentCompleted: number[]
  previousCompleted: number[]
}

interface PlanCompareDetailProps {
  activePlanId: string
  sourcePlanId: string
  weeks: WeekComparison[]
  planType: string
}

export function PlanCompareDetail({ activePlanId, sourcePlanId, weeks: rawWeeks, planType }: PlanCompareDetailProps) {
  const router = useRouter()
  const [expandedWeek, setExpandedWeek] = useState<number | null>(null)

  // Convert arrays to Sets for fast lookup
  const weeks = rawWeeks.map(w => ({
    ...w,
    currentCompletedSet: new Set(w.currentCompleted),
    previousCompletedSet: new Set(w.previousCompleted),
  }))
  const [selectedWeeks, setSelectedWeeks] = useState<Set<number>>(new Set())
  const [applying, setApplying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggleWeekSelection(weekNum: number) {
    setSelectedWeeks(prev => {
      const next = new Set(prev)
      if (next.has(weekNum)) {
        next.delete(weekNum)
      } else {
        next.add(weekNum)
      }
      return next
    })
  }

  async function handleApplyWeeks() {
    if (selectedWeeks.size === 0) return
    setApplying(true)
    setError(null)

    try {
      const res = await fetch(`/api/fitness/plans/${activePlanId}/apply-weeks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_plan_id: sourcePlanId,
          week_numbers: [...selectedWeeks].sort((a, b) => a - b),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Failed to apply weeks')
        return
      }

      router.push('/fitness/my-plan')
      router.refresh()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setApplying(false)
    }
  }

  const isMeal = planType === 'meal'

  return (
    <div className="space-y-4">
      {/* Apply selected weeks bar */}
      {!isMeal && selectedWeeks.size > 0 && (
        <div className="sticky top-0 z-10 rounded-lg border border-blue-400/30 bg-surface p-3 flex items-center justify-between gap-3">
          <p className="text-secondary text-sm">
            {selectedWeeks.size} week{selectedWeeks.size > 1 ? 's' : ''} selected from previous plan
          </p>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedWeeks(new Set())}
              className="text-xs text-muted hover:text-secondary transition-colors"
            >
              Clear
            </button>
            <button
              onClick={handleApplyWeeks}
              disabled={applying}
              className="btn-primary px-4 py-1.5 text-sm rounded flex items-center gap-1.5 disabled:opacity-40"
            >
              {applying ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Applying...</>
              ) : (
                <>Apply to New Plan</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Week-by-week comparison */}
      {weeks.map(week => {
        const expanded = expandedWeek === week.week_number
        const isSelected = selectedWeeks.has(week.week_number)
        const currentTheme = week.current?.theme ?? week.current?.focus ?? ''
        const previousTheme = week.previous?.theme ?? week.previous?.focus ?? ''
        const currentSessions = week.current?.sessions ?? []
        const previousSessions = week.previous?.sessions ?? []
        const maxSessions = Math.max(currentSessions.length, previousSessions.length)

        return (
          <div
            key={week.week_number}
            className={cn(
              'rounded-lg border bg-surface overflow-hidden',
              isSelected ? 'border-blue-400/50' : 'border-subtle'
            )}
          >
            {/* Week header */}
            <div className="px-4 py-2.5 bg-elevated/50 border-b border-subtle flex items-center gap-3">
              <button
                onClick={() => setExpandedWeek(expanded ? null : week.week_number)}
                className="flex-1 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <span className="text-primary font-bold text-xs">Week {week.week_number}</span>
                  {(currentTheme || previousTheme) && (
                    <span className="text-muted text-xs">
                      {currentTheme === previousTheme
                        ? currentTheme
                        : currentTheme && previousTheme
                        ? `${currentTheme} / ${previousTheme}`
                        : currentTheme || previousTheme}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-accent text-xs font-medium">
                    New: {week.currentCompletedSet.size}/{currentSessions.length}
                  </span>
                  <span className="text-blue-400 text-xs font-medium">
                    Prev: {week.previousCompletedSet.size}/{previousSessions.length}
                  </span>
                  {expanded ? <ChevronUp className="h-4 w-4 text-muted" /> : <ChevronDown className="h-4 w-4 text-muted" />}
                </div>
              </button>
            </div>

            {/* Expanded: side-by-side session details */}
            {expanded && (
              <div className="divide-y divide-subtle/50">
                {/* Column headers */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-0">
                  <div className="px-4 py-1.5 bg-accent/5 sm:border-r border-subtle">
                    <span className="text-accent text-[10px] uppercase font-medium tracking-wider">New Plan</span>
                  </div>
                  <div className="px-4 py-1.5 bg-blue-400/5 flex items-center justify-between">
                    <span className="text-blue-400 text-[10px] uppercase font-medium tracking-wider">Previous Plan</span>
                    {/* Cherry-pick checkbox in the previous plan column header */}
                    {!isMeal && week.previous && (
                      <button
                        onClick={() => toggleWeekSelection(week.week_number)}
                        className={cn(
                          'flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-medium transition-colors',
                          isSelected
                            ? 'text-blue-400'
                            : 'text-muted hover:text-blue-400'
                        )}
                      >
                        <span className={cn(
                          'h-4 w-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors',
                          isSelected
                            ? 'bg-blue-500 border-blue-500 text-white'
                            : 'border-subtle hover:border-blue-400'
                        )}>
                          {isSelected && <Check className="h-2.5 w-2.5" />}
                        </span>
                        Use This Week
                      </button>
                    )}
                  </div>
                </div>

                {Array.from({ length: maxSessions }, (_, i) => {
                  const cs = currentSessions[i] as Session | undefined
                  const ps = previousSessions[i] as Session | undefined
                  const sessionNum = i + 1

                  return (
                    <div key={i} className="grid grid-cols-1 sm:grid-cols-2 gap-0">
                      {/* New plan session */}
                      <div className="px-4 py-3 sm:border-r border-subtle">
                        {cs ? (
                          <SessionDetail
                            session={cs}
                            completed={week.currentCompletedSet.has(sessionNum)}
                            planType={planType}
                            accentColor="accent"
                          />
                        ) : (
                          <p className="text-muted text-xs italic">No session</p>
                        )}
                      </div>

                      {/* Previous plan session */}
                      <div className={cn('px-4 py-3', isSelected && 'bg-blue-400/5')}>
                        {ps ? (
                          <SessionDetail
                            session={ps}
                            completed={week.previousCompletedSet.has(sessionNum)}
                            planType={planType}
                            accentColor="blue-400"
                          />
                        ) : (
                          <p className="text-muted text-xs italic">No session</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function SessionDetail({
  session,
  completed,
  planType,
  accentColor,
}: {
  session: Session
  completed: boolean
  planType: string
  accentColor: string
}) {
  const isStrength = planType === 'strength'

  return (
    <div className="space-y-1.5">
      {/* Title + completion */}
      <div className="flex items-start gap-2">
        {completed ? (
          <div className={cn('h-4 w-4 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5', `bg-${accentColor}/20`)}>
            <Check className={cn('h-2.5 w-2.5', `text-${accentColor}`)} />
          </div>
        ) : (
          <div className="h-4 w-4 rounded-full border border-subtle flex-shrink-0 flex items-center justify-center mt-0.5">
            <Minus className="h-2.5 w-2.5 text-muted/40" />
          </div>
        )}
        <div className="min-w-0">
          <p className="text-primary text-sm font-medium leading-tight">{session.title}</p>
          <span className="text-[10px] text-muted uppercase">{session.type.replace(/_/g, ' ')}</span>
        </div>
      </div>

      {/* Run details */}
      {!isStrength && (
        <div className="flex gap-3 text-xs text-muted pl-6">
          {session.distance_miles ? <span>{session.distance_miles} mi</span> : null}
          {session.duration_min ? <span>{session.duration_min} min</span> : null}
          {session.effort_level ? <span>{session.effort_level}</span> : null}
        </div>
      )}

      {/* Description */}
      {session.description && (
        <p className="text-secondary text-xs pl-6 line-clamp-2">{session.description}</p>
      )}

      {/* Strength exercises */}
      {isStrength && session.exercises && session.exercises.length > 0 && (
        <div className="pl-6 space-y-0.5">
          {session.exercises.map((ex, j) => (
            <div key={j} className="flex items-baseline gap-1.5 text-xs">
              <span className="text-primary">{ex.name}</span>
              <span className="text-muted">{ex.sets} &times; {ex.reps}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
