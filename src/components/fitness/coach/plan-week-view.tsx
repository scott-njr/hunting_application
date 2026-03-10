import { PlanSessionCard } from './plan-session-card'

interface WeekData {
  week_number: number
  theme: string
  sessions: Array<{
    session_number: number
    type: string
    title: string
    distance_miles?: number
    duration_min?: number
    effort_level?: string
    description: string
    warmup?: string
    exercises?: Array<{ name: string; sets: number; reps: string; notes?: string }>
    cooldown?: string
  }>
}

interface PlanWeekViewProps {
  week: WeekData
  planId: string
  loggedSessions: Set<number> // session_numbers that have been logged
}

export function PlanWeekView({ week, planId, loggedSessions }: PlanWeekViewProps) {
  const totalSessions = week.sessions.length
  const completedSessions = week.sessions.filter(s => loggedSessions.has(s.session_number)).length

  return (
    <div className="rounded-lg border border-subtle bg-surface p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-primary font-bold text-sm">Week {week.week_number}</h3>
          <p className="text-muted text-xs">{week.theme}</p>
        </div>
        <span className="text-xs text-muted">
          {completedSessions}/{totalSessions} sessions
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full bg-elevated mb-4 overflow-hidden">
        <div
          className="h-full rounded-full bg-accent transition-all"
          style={{ width: `${totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0}%` }}
        />
      </div>

      <div className="space-y-3">
        {week.sessions.map((session) => (
          <PlanSessionCard
            key={session.session_number}
            session={session}
            planId={planId}
            weekNumber={week.week_number}
            isLogged={loggedSessions.has(session.session_number)}
          />
        ))}
      </div>
    </div>
  )
}
