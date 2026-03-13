'use client'

import { Fragment, useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Check, ChevronDown, ChevronUp, Info, Moon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TYPE_COLORS } from '@/lib/fitness/constants'
import { parseLocalDate, getWeekMonday } from '@/lib/fitness/date-helpers'

// ─── Types ──────────────────────────────────────────────────────────────────────

interface Session {
  session_number: number
  type: string
  title: string
  description?: string
  // Run fields
  distance_miles?: number
  duration_min?: number
  effort_level?: string
  // Strength fields
  warmup?: string
  exercises?: Array<{ name: string; sets: number; reps: string; notes?: string }>
  cooldown?: string
  // Meal fields
  meal_type?: string
  day_name?: string
  day_number?: number
  calories?: number
  protein_g?: number
  ingredients?: string[]
  instructions?: string
  estimated_cost_usd?: number
}

interface WeekData {
  week_number: number
  theme: string
  sessions: Session[]
}

interface LogRecord {
  plan_id: string
  week_number: number
  session_number: number
  notes: string | null
  completed_at: string
}

interface PlanInput {
  planId: string
  planType: 'run' | 'strength' | 'meal'
  weeks: WeekData[]
  daysPerWeek: number
  startedAt: string
  logsByWeek: Map<number, Set<number>>
  logs: LogRecord[]
}

interface PlanTableViewProps {
  plans: PlanInput[]
  currentWeek?: number
}

// ─── Constants ──────────────────────────────────────────────────────────────────

/** Default training days (0=Sun, 1=Mon, ..., 6=Sat) based on sessions per week */
const TRAINING_DAYS: Record<number, number[]> = {
  1: [1],
  2: [2, 4],             // Tue, Thu
  3: [1, 3, 5],          // Mon, Wed, Fri
  4: [1, 2, 4, 5],       // Mon, Tue, Thu, Fri
  5: [1, 2, 3, 4, 5],    // Mon–Fri
  6: [1, 2, 3, 4, 5, 6], // Mon–Sat
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// TYPE_COLORS imported from @/lib/fitness/constants

const DEFAULT_TYPE_COLOR = { border: 'border-l-accent', bg: '', badge: 'bg-surface border-subtle text-muted' }

const RUN_TYPE_INFO = [
  { type: 'easy_run', label: 'Easy Run', desc: 'Comfortable pace you can hold a conversation at. Builds your aerobic base.' },
  { type: 'tempo_run', label: 'Tempo Run', desc: 'Sustained "comfortably hard" effort. Improves lactate threshold.' },
  { type: 'intervals', label: 'Intervals', desc: 'Repeated hard efforts with recovery. Builds speed and VO2max.' },
  { type: 'long_run', label: 'Long Run', desc: 'Extended distance at easy pace. Builds endurance and mental toughness.' },
  { type: 'recovery_run', label: 'Recovery Run', desc: 'Very easy, short run. Promotes blood flow and active recovery.' },
  { type: 'cross_train', label: 'Cross Train', desc: 'Non-running activity (cycling, swimming, hiking). Reduces injury risk.' },
]

// ─── Helpers ────────────────────────────────────────────────────────────────────

function getTypeColor(sessionType: string) {
  return TYPE_COLORS[sessionType] ?? DEFAULT_TYPE_COLOR
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function formatDateRange(start: Date, end: Date): string {
  const sm = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const em = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `${sm} – ${em}`
}


/** Convert JS dayOfWeek (0=Sun) to meal day_number (1=Mon..7=Sun) */
function toDayNumber(dayOfWeek: number): number {
  return dayOfWeek === 0 ? 7 : dayOfWeek
}

interface DayEntry {
  date: Date
  dayOfWeek: number // 0=Sun, 1=Mon, ..., 6=Sat
  sessions: Array<{
    plan: PlanInput
    session: Session
    weekNumber: number
    isLogged: boolean
    logRecord: LogRecord | undefined
  }>
  isOffDay: boolean
  offDayPlans: PlanInput[]
  offDayLogs: Array<{ plan: PlanInput; logRecord: LogRecord | undefined }>
}

/** Build a flat list of days across all weeks, interleaving multiple plans */
function buildTimeline(
  plans: PlanInput[],
): { weeks: Array<{ weekNumber: number; theme: string; days: DayEntry[]; plans: PlanInput[] }> } {
  if (plans.length === 0) return { weeks: [] }

  // Use the earliest started_at to determine the timeline start
  const starts = plans.map(p => parseLocalDate(p.startedAt))
  const earliest = new Date(Math.min(...starts.map(s => s.getTime())))
  const weekMonday = getWeekMonday(earliest)

  const maxWeeks = Math.max(...plans.map(p => p.weeks.length))

  const result: Array<{ weekNumber: number; theme: string; days: DayEntry[]; plans: PlanInput[] }> = []

  for (let w = 0; w < maxWeeks; w++) {
    const weekStart = addDays(weekMonday, w * 7)
    const weekNumber = w + 1

    // Gather themes from all plans for this week
    const themes: string[] = []
    for (const plan of plans) {
      const pw = plan.weeks.find(wk => wk.week_number === weekNumber)
      if (pw) themes.push(pw.theme)
    }
    const theme = themes.join(' / ')

    const days: DayEntry[] = []

    for (let d = 0; d < 7; d++) {
      const date = addDays(weekStart, d)
      const dayOfWeek = date.getDay() // 0=Sun, 1=Mon, ..., 6=Sat

      const sessions: DayEntry['sessions'] = []
      let hasContent = false

      for (const plan of plans) {
        const pw = plan.weeks.find(wk => wk.week_number === weekNumber)
        if (!pw) continue

        if (plan.planType === 'meal') {
          // Meal plans: match sessions by day_number
          const dayNum = toDayNumber(dayOfWeek)
          const daySessions = pw.sessions.filter(s => s.day_number === dayNum)
          if (daySessions.length > 0) {
            hasContent = true
            const weekLogged = plan.logsByWeek.get(weekNumber) ?? new Set<number>()
            for (const session of daySessions) {
              const logRecord = plan.logs.find(
                l => l.plan_id === plan.planId && l.week_number === weekNumber && l.session_number === session.session_number
              )
              sessions.push({
                plan,
                session,
                weekNumber,
                isLogged: weekLogged.has(session.session_number),
                logRecord,
              })
            }
          }
        } else {
          // Run/strength: use TRAINING_DAYS mapping
          const trainingDays = TRAINING_DAYS[plan.daysPerWeek] ?? TRAINING_DAYS[3]
          if (trainingDays.includes(dayOfWeek)) {
            hasContent = true
            const dayIndex = trainingDays.indexOf(dayOfWeek)
            const session = pw.sessions[dayIndex]
            if (session) {
              const weekLogged = plan.logsByWeek.get(weekNumber) ?? new Set<number>()
              const logRecord = plan.logs.find(
                l => l.plan_id === plan.planId && l.week_number === weekNumber && l.session_number === session.session_number
              )
              sessions.push({
                plan,
                session,
                weekNumber,
                isLogged: weekLogged.has(session.session_number),
                logRecord,
              })
            }
          }
        }
      }

      const offDayLogs: DayEntry['offDayLogs'] = []
      const offDayPlans: PlanInput[] = []
      if (!hasContent) {
        if (dayOfWeek === 0) {
          for (const plan of plans.filter(p => p.planType !== 'meal')) {
            const logRecord = plan.logs.find(
              l => l.plan_id === plan.planId && l.week_number === weekNumber && l.session_number === 0
            )
            offDayPlans.push(plan)
            offDayLogs.push({ plan, logRecord })
          }
        }
      }

      days.push({
        date,
        dayOfWeek,
        sessions,
        isOffDay: !hasContent,
        offDayPlans,
        offDayLogs,
      })
    }

    result.push({ weekNumber, theme, days, plans })
  }

  return { weeks: result }
}

// ─── Session Row ────────────────────────────────────────────────────────────────

function SessionRow({
  session,
  weekNumber,
  plan,
  date,
  isLogged,
  logRecord,
  showPlanBadge,
  colSpan,
  showDate,
}: {
  session: Session
  weekNumber: number
  plan: PlanInput
  date: Date
  isLogged: boolean
  logRecord: LogRecord | undefined
  showPlanBadge: boolean
  colSpan: number
  showDate: boolean
}) {
  const router = useRouter()
  const [logging, setLogging] = useState(false)
  const [logged, setLogged] = useState(isLogged)
  const [showNoteInput, setShowNoteInput] = useState(false)
  const [noteText, setNoteText] = useState(logRecord?.notes ?? '')
  const [expanded, setExpanded] = useState(false)

  // Sync logged state with server data after router.refresh()
  useEffect(() => { setLogged(isLogged) }, [isLogged])

  const typeColor = getTypeColor(plan.planType === 'meal' ? 'meal' : plan.planType === 'strength' ? 'strength' : session.type)
  const isStrength = plan.planType === 'strength' && session.exercises
  const isMeal = plan.planType === 'meal'

  async function handleLog() {
    setLogging(true)
    if (logged) {
      // Uncheck: toggle completed to false (preserves notes)
      const res = await fetch(`/api/fitness/plans/${plan.planId}/logs`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          week_number: weekNumber,
          session_number: session.session_number,
          completed: false,
        }),
      })
      if (res.ok) {
        setLogged(false)
        router.refresh()
      }
    } else {
      // Check: upsert with completed=true
      const res = await fetch(`/api/fitness/plans/${plan.planId}/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          week_number: weekNumber,
          session_number: session.session_number,
          notes: noteText.trim() || null,
        }),
      })
      if (res.ok) {
        setLogged(true)
        setShowNoteInput(false)
        router.refresh()
      }
    }
    setLogging(false)
  }

  async function handleSaveNote() {
    setLogging(true)
    const res = await fetch(`/api/fitness/plans/${plan.planId}/logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        week_number: weekNumber,
        session_number: session.session_number,
        notes: noteText.trim() || null,
      }),
    })
    if (res.ok) {
      setShowNoteInput(false)
      router.refresh()
    }
    setLogging(false)
  }

  return (
    <>
      <tr className={cn(
        'border-b border-subtle border-l-4 transition-colors',
        typeColor.border,
        typeColor.bg,
        logged ? 'bg-green-950/10' : 'hover:bg-elevated/30'
      )}>
        {/* Checkbox */}
        <td className="px-2 py-2 text-center w-9">
          <button
            onClick={handleLog}
            disabled={logging}
            className={cn(
              'h-7 w-7 rounded-full mx-auto flex items-center justify-center transition-colors disabled:opacity-40',
              logged
                ? 'bg-green-500/20 hover:bg-red-500/20'
                : 'border border-subtle hover:border-accent'
            )}
            title={logged ? 'Unmark' : 'Mark complete'}
          >
            {logging ? (
              <span className="h-3 w-3 border border-accent/30 border-t-accent rounded-full animate-spin" />
            ) : logged ? (
              <Check className="h-3 w-3 text-green-400" />
            ) : null}
          </button>
        </td>

        {/* Date */}
        <td className="px-2 py-2 whitespace-nowrap">
          {showDate && (
            <span className={cn('text-xs', logged ? 'text-muted' : 'text-secondary')}>
              {formatDate(date)}
            </span>
          )}
        </td>

        {/* Plan badge */}
        {showPlanBadge && (
          <td className="px-2 py-2">
            <span className={cn(
              'text-[10px] px-1.5 py-0.5 rounded font-medium uppercase tracking-wider',
              plan.planType === 'run' ? 'bg-emerald-950/30 text-emerald-300'
                : plan.planType === 'meal' ? 'bg-stone-800/30 text-stone-300'
                : 'bg-orange-950/30 text-orange-300'
            )}>
              {plan.planType === 'run' ? 'Run' : plan.planType === 'meal' ? 'Meal' : 'Str'}
            </span>
          </td>
        )}

        {/* Type badge */}
        <td className="px-2 py-2">
          <span className={cn(
            'text-xs px-1.5 py-0.5 rounded border capitalize whitespace-nowrap',
            typeColor.badge
          )}>
            {isMeal ? (session.meal_type ?? 'meal') : session.type.replace(/_/g, ' ')}
          </span>
        </td>

        {/* Title */}
        <td className="px-2 py-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className={cn(
              'text-sm text-left flex items-center gap-1',
              logged ? 'text-muted line-through' : 'text-primary hover:text-accent'
            )}
          >
            {session.title}
            {expanded
              ? <ChevronUp className="h-3 w-3 text-muted flex-shrink-0" />
              : <ChevronDown className="h-3 w-3 text-muted flex-shrink-0" />
            }
          </button>
        </td>

        {/* Distance / Duration / Calories */}
        <td className="px-2 py-2 text-xs text-muted whitespace-nowrap">
          {isMeal && session.calories != null && (
            <span>{session.calories} cal</span>
          )}
          {plan.planType === 'run' && (
            <>
              {session.distance_miles ? <span>{session.distance_miles} mi</span> : null}
              {session.distance_miles && session.duration_min ? <span> / </span> : null}
              {session.duration_min ? <span>{session.duration_min} min</span> : null}
            </>
          )}
          {plan.planType === 'strength' && session.duration_min && (
            <span>{session.duration_min} min</span>
          )}
        </td>

        {/* Effort / Exercise count / Protein */}
        <td className="px-2 py-2 text-xs text-muted">
          {isMeal && session.protein_g != null && (
            <span>{session.protein_g}g protein</span>
          )}
          {plan.planType === 'run' && session.effort_level && (
            <span className="truncate max-w-[120px] block" title={session.effort_level}>
              {session.effort_level}
            </span>
          )}
          {plan.planType === 'strength' && session.exercises && (
            <span>{session.exercises.length} exercises</span>
          )}
        </td>

        {/* Log notes + date */}
        <td className="px-2 py-2">
          <div className="text-xs space-y-1">
            {logged && logRecord?.notes && (
              <p className="text-secondary truncate max-w-[140px]" title={logRecord.notes}>
                {logRecord.notes}
              </p>
            )}
            <button
              onClick={() => setShowNoteInput(!showNoteInput)}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-subtle text-muted hover:text-secondary hover:border-default text-[11px] transition-colors"
            >
              {logged && logRecord?.notes ? 'Edit Note' : '+ Add Note'}
            </button>
          </div>
        </td>
      </tr>

      {/* Expanded details row */}
      {expanded && (
        <tr className="border-b border-subtle">
          <td colSpan={colSpan} className="px-2 py-3 bg-elevated/20">
            <div className="pl-8 space-y-2 text-sm max-w-2xl">
              {session.description && <p className="text-secondary">{session.description}</p>}
              {isStrength && (
                <>
                  {session.warmup && (
                    <div>
                      <span className="text-muted text-xs font-medium uppercase">Warmup</span>
                      <p className="text-secondary text-xs">{session.warmup}</p>
                    </div>
                  )}
                  {session.exercises && session.exercises.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-muted text-xs font-medium uppercase">Exercises</span>
                      {session.exercises.map((ex, i) => (
                        <div key={i} className="flex items-baseline gap-2 text-xs text-secondary">
                          <span className="text-primary font-medium">{ex.name}</span>
                          <span className="text-muted">—</span>
                          <span>{ex.sets} × {ex.reps}</span>
                          {ex.notes && <span className="text-muted">({ex.notes})</span>}
                        </div>
                      ))}
                    </div>
                  )}
                  {session.cooldown && (
                    <div>
                      <span className="text-muted text-xs font-medium uppercase">Cooldown</span>
                      <p className="text-secondary text-xs">{session.cooldown}</p>
                    </div>
                  )}
                </>
              )}
              {isMeal && (
                <>
                  {session.ingredients && session.ingredients.length > 0 && (
                    <div>
                      <span className="text-muted text-xs font-medium uppercase">Ingredients</span>
                      <ul className="mt-1 space-y-0.5">
                        {session.ingredients.map((ing, i) => (
                          <li key={i} className="text-secondary text-xs">&bull; {ing}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {session.instructions && (
                    <div>
                      <span className="text-muted text-xs font-medium uppercase">Instructions</span>
                      <p className="text-secondary text-xs mt-1">{session.instructions}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </td>
        </tr>
      )}

      {/* Note input row */}
      {showNoteInput && (
        <tr className="border-b border-subtle">
          <td colSpan={colSpan} className="px-2 py-2 bg-elevated/30">
            <div className="flex items-center gap-2 max-w-md pl-8">
              <input
                type="text"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                className="flex-1 input-field text-xs py-1.5"
                placeholder="How did it go? (optional)"
                onKeyDown={(e) => e.key === 'Enter' && (logged ? handleSaveNote() : handleLog())}
                autoFocus
              />
              <button
                onClick={logged ? handleSaveNote : handleLog}
                disabled={logging}
                className="btn-primary px-3 py-1.5 text-xs rounded disabled:opacity-40 whitespace-nowrap"
              >
                {logging ? 'Saving...' : logged ? 'Save Note' : 'Complete'}
              </button>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

// ─── Off-Day Row ────────────────────────────────────────────────────────────────

function OffDayRow({
  date,
  weekNumber,
  plan,
  logRecord,
  showPlanBadge,
  colSpan,
}: {
  date: Date
  weekNumber: number
  plan: PlanInput
  logRecord: LogRecord | undefined
  showPlanBadge: boolean
  colSpan: number
}) {
  const router = useRouter()
  const [showInput, setShowInput] = useState(false)
  const [saving, setSaving] = useState(false)
  const [noteText, setNoteText] = useState(logRecord?.notes ?? '')
  const [saved, setSaved] = useState(!!logRecord)

  async function handleSave() {
    if (!noteText.trim()) return
    setSaving(true)
    const res = await fetch(`/api/fitness/plans/${plan.planId}/logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        week_number: weekNumber,
        session_number: 0,
        notes: noteText.trim(),
      }),
    })
    if (res.ok) {
      setSaved(true)
      setShowInput(false)
      router.refresh()
    }
    setSaving(false)
  }

  return (
    <>
      <tr className="border-b border-subtle/50 bg-surface/30">
        <td className="px-2 py-1.5 text-center w-9">
          <Moon className="h-3 w-3 text-muted/40 mx-auto" />
        </td>
        <td className="px-2 py-1.5 whitespace-nowrap">
          <span className="text-[11px] text-muted/60 italic">{formatDate(date)}</span>
        </td>
        {showPlanBadge && <td className="px-2 py-1.5" />}
        <td className="px-2 py-1.5">
          <span className="text-[11px] text-muted/40 italic">rest</span>
        </td>
        <td className="px-2 py-1.5" colSpan={2}>
          <span className="text-[11px] text-muted/40 italic">Recovery &amp; rest</span>
        </td>
        <td className="px-2 py-1.5" />
        <td className="px-2 py-1.5">
          <div className="text-[11px] space-y-1">
            {saved && logRecord?.notes && (
              <p className="text-secondary truncate max-w-[120px]" title={logRecord.notes}>{logRecord.notes}</p>
            )}
            <button
              onClick={() => setShowInput(!showInput)}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-subtle text-muted hover:text-secondary hover:border-default text-[11px] transition-colors"
            >
              {saved && logRecord?.notes ? 'Edit Note' : '+ Add Note'}
            </button>
          </div>
        </td>
      </tr>

      {showInput && (
        <tr className="border-b border-subtle">
          <td colSpan={colSpan} className="px-2 py-2 bg-elevated/30">
            <div className="flex items-center gap-2 max-w-md pl-8">
              <input
                type="text"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                className="flex-1 input-field text-xs py-1.5"
                placeholder="How are you feeling? Soreness, energy, etc."
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                autoFocus
              />
              <button
                onClick={handleSave}
                disabled={saving || !noteText.trim()}
                className="btn-primary px-3 py-1.5 text-xs rounded disabled:opacity-40 whitespace-nowrap"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

// ─── Simple Off-Day Row (no notes, just a visual spacer for non-Sunday rest days) ──

function SimpleOffDayRow({ date, showPlanBadge }: { date: Date; showPlanBadge: boolean }) {
  return (
    <tr className="border-b border-subtle/30">
      <td className="px-2 py-1 text-center w-9">
        <Moon className="h-2.5 w-2.5 text-muted/25 mx-auto" />
      </td>
      <td className="px-2 py-1 whitespace-nowrap">
        <span className="text-[10px] text-muted/40 italic">{DAY_NAMES[date.getDay()]}</span>
      </td>
      {showPlanBadge && <td className="px-2 py-1" />}
      <td className="px-2 py-1" colSpan={5}>
        <span className="text-[10px] text-muted/25 italic">rest</span>
      </td>
    </tr>
  )
}

// ─── Main Table Component ───────────────────────────────────────────────────────

export function PlanTableView({ plans, currentWeek }: PlanTableViewProps) {
  const [legendOpen, setLegendOpen] = useState(false)
  const currentWeekRef = useRef<HTMLTableRowElement>(null)

  // No auto-scroll — page should load at the top

  const hasRunPlan = plans.some(p => p.planType === 'run')
  // Show plan badge column when there are multiple plan types
  const planTypeCount = new Set(plans.map(p => p.planType)).size
  const showPlanBadge = planTypeCount > 1
  const colSpan = showPlanBadge ? 9 : 8

  const timeline = buildTimeline(plans)

  return (
    <div className="rounded-lg border border-subtle bg-surface overflow-hidden">
      {/* Run Type Guide (collapsible) */}
      {hasRunPlan && (
        <div className="px-4 py-3 border-b border-subtle">
          <button
            onClick={() => setLegendOpen(!legendOpen)}
            className="flex items-center gap-2 text-xs text-muted hover:text-secondary transition-colors"
          >
            <Info className="h-3.5 w-3.5" />
            <span>Session Type Guide</span>
            {legendOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
          {legendOpen && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mt-3">
              {RUN_TYPE_INFO.map(rt => {
                const color = getTypeColor(rt.type)
                return (
                  <div key={rt.type} className={cn('rounded border p-2', color.badge)}>
                    <span className="text-xs font-medium">{rt.label}</span>
                    <p className="text-[11px] mt-1 leading-relaxed opacity-80">{rt.desc}</p>
                  </div>
                )
              })}
              {plans.some(p => p.planType === 'strength') && (
                <div className={cn('rounded border p-2', getTypeColor('strength').badge)}>
                  <span className="text-xs font-medium">Strength</span>
                  <p className="text-[11px] mt-1 leading-relaxed opacity-80">Resistance training — compound lifts and bodyweight exercises.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[800px]">
          <thead>
            <tr className="border-b border-default text-left">
              <th className="px-2 py-2 w-9" />
              <th className="px-2 py-2 text-muted text-[11px] font-medium uppercase tracking-wider">Date</th>
              {showPlanBadge && (
                <th className="px-2 py-2 text-muted text-[11px] font-medium uppercase tracking-wider">Plan</th>
              )}
              <th className="px-2 py-2 text-muted text-[11px] font-medium uppercase tracking-wider">Type</th>
              <th className="px-2 py-2 text-muted text-[11px] font-medium uppercase tracking-wider">Title</th>
              <th className="px-2 py-2 text-muted text-[11px] font-medium uppercase tracking-wider">Dist / Dur</th>
              <th className="px-2 py-2 text-muted text-[11px] font-medium uppercase tracking-wider">Effort</th>
              <th className="px-2 py-2 text-muted text-[11px] font-medium uppercase tracking-wider">Notes</th>
            </tr>
          </thead>
          <tbody>
            {timeline.weeks.map((week) => {
              // Calculate completion across all plans + meals for this week
              let totalSessions = 0
              let completedSessions = 0
              for (const plan of plans) {
                const pw = plan.weeks.find(w => w.week_number === week.weekNumber)
                if (pw) {
                  totalSessions += pw.sessions.length
                  const weekLogged = plan.logsByWeek.get(week.weekNumber) ?? new Set<number>()
                  completedSessions += pw.sessions.filter(s => weekLogged.has(s.session_number)).length
                }
              }
              const pct = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0
              const weekStart = week.days[0]?.date
              const weekEnd = week.days[6]?.date

              return (
                <Fragment key={week.weekNumber}>
                  {/* Week header */}
                  <tr
                    ref={currentWeek && week.weekNumber === currentWeek ? currentWeekRef : undefined}
                    className={cn(
                      'border-t-2 border-default',
                      currentWeek && week.weekNumber === currentWeek
                        ? 'bg-accent/10'
                        : 'bg-elevated/50'
                    )}
                  >
                    <td colSpan={colSpan} className="px-3 py-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-primary font-bold text-xs">Week {week.weekNumber}</span>
                          {currentWeek && week.weekNumber === currentWeek && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/20 text-accent font-medium uppercase tracking-wider">Current</span>
                          )}
                          {week.theme && <span className="text-muted text-xs">— {week.theme}</span>}
                          {weekStart && weekEnd && (
                            <span className="text-muted/60 text-[11px]">{formatDateRange(weekStart, weekEnd)}</span>
                          )}
                        </div>
                        <span className={cn(
                          'text-xs font-medium',
                          completedSessions === totalSessions && completedSessions > 0 ? 'text-green-400' : 'text-muted'
                        )}>
                          {completedSessions}/{totalSessions}
                        </span>
                      </div>
                      <div className="h-1 rounded-full bg-elevated mt-1.5 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-accent transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </td>
                  </tr>

                  {/* Day rows */}
                  {week.days.map((day) => {
                    const hasContent = day.sessions.length > 0

                    if (hasContent) {
                      let dateShown = false
                      const rows: React.ReactNode[] = []

                      for (const entry of day.sessions) {
                        rows.push(
                          <SessionRow
                            key={`w${entry.weekNumber}-${entry.plan.planId}-s${entry.session.session_number}`}
                            session={entry.session}
                            weekNumber={entry.weekNumber}
                            plan={entry.plan}
                            date={day.date}
                            isLogged={entry.isLogged}
                            logRecord={entry.logRecord}
                            showPlanBadge={showPlanBadge}
                            colSpan={colSpan}
                            showDate={!dateShown}
                          />
                        )
                        dateShown = true
                      }

                      return <Fragment key={day.date.toISOString()}>{rows}</Fragment>
                    }

                    // Sunday off-day with note capability
                    if (day.dayOfWeek === 0 && day.offDayLogs.length > 0) {
                      return (
                        <OffDayRow
                          key={day.date.toISOString()}
                          date={day.date}
                          weekNumber={week.weekNumber}
                          plan={day.offDayPlans[0]}
                          logRecord={day.offDayLogs[0]?.logRecord}
                          showPlanBadge={showPlanBadge}
                          colSpan={colSpan}
                        />
                      )
                    }

                    // Other off days — minimal visual spacer (only for workout plans, skip if meal-only)
                    if (day.isOffDay && plans.length > 0) {
                      return (
                        <SimpleOffDayRow
                          key={day.date.toISOString()}
                          date={day.date}
                          showPlanBadge={showPlanBadge}
                        />
                      )
                    }

                    return null
                  })}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
