import Link from 'next/link'
import {
  Activity, Dumbbell, UtensilsCrossed, Flame, Crosshair, ClipboardList, Calendar,
} from 'lucide-react'
import { cn } from '@/lib/utils'

/** Color coding for run session types — matches PlanTableView */
const TYPE_COLORS: Record<string, { border: string; badge: string }> = {
  easy_run:     { border: 'border-l-green-500', badge: 'bg-green-950/30 text-green-300 border-green-500/30' },
  tempo_run:    { border: 'border-l-amber-500', badge: 'bg-amber-950/30 text-amber-300 border-amber-500/30' },
  intervals:    { border: 'border-l-red-400', badge: 'bg-red-950/30 text-red-300 border-red-400/30' },
  long_run:     { border: 'border-l-blue-400', badge: 'bg-blue-950/30 text-blue-300 border-blue-400/30' },
  recovery_run: { border: 'border-l-violet-400', badge: 'bg-violet-950/30 text-violet-300 border-violet-400/30' },
  cross_train:  { border: 'border-l-cyan-400', badge: 'bg-cyan-950/30 text-cyan-300 border-cyan-400/30' },
  strength:     { border: 'border-l-orange-400', badge: 'bg-orange-950/30 text-orange-300 border-orange-400/30' },
  meal:         { border: 'border-l-accent', badge: 'bg-accent/10 text-accent border-accent/30' },
  trip:         { border: 'border-l-accent', badge: 'bg-accent/10 text-accent border-accent/30' },
  deadline:     { border: 'border-l-amber-500', badge: 'bg-amber-950/30 text-amber-300 border-amber-500/30' },
}

const DEFAULT_TYPE_COLOR = { border: 'border-l-accent', badge: 'bg-surface border-subtle text-muted' }

function getTypeColor(sessionType: string) {
  return TYPE_COLORS[sessionType] ?? DEFAULT_TYPE_COLOR
}

const CATEGORY_ICONS = {
  run: Activity,
  strength: Dumbbell,
  meals: UtensilsCrossed,
  trip: Crosshair,
  deadline: ClipboardList,
  wow: Flame,
} as const

export type DayItemType = keyof typeof CATEGORY_ICONS

export interface DayItem {
  type: DayItemType
  /** Display label (used for meals, trips, deadlines) */
  label: string
  href: string
  /** Structured fields for run/strength sessions */
  sessionType?: string        // e.g. 'easy_run', 'tempo_run', 'strength'
  title?: string              // e.g. 'Easy Aerobic Run'
  distanceMiles?: number
  durationMin?: number
  effortLevel?: string
  exerciseCount?: number      // for strength sessions
}

/** Items not tied to a specific day (e.g. weekly challenge) */
export interface FlexItem {
  type: 'wow'
  title: string
  subtitle: string
  href: string
}

export interface WeekDay {
  date: string
  dayName: string
  dayNum: number
  isToday: boolean
  items: DayItem[]
}

export interface WeeklyPreviewProps {
  days: WeekDay[]
  flexItems: FlexItem[]
}

function SessionItem({ item }: { item: DayItem }) {
  const isRun = item.type === 'run' && item.sessionType
  const isStrength = item.type === 'strength' && item.sessionType
  const typeColor = getTypeColor(item.sessionType ?? item.type)

  // Rich session row (run or strength)
  if (isRun || isStrength) {
    return (
      <Link
        href={item.href}
        className={cn(
          'flex items-center gap-2 group border-l-2 pl-2 py-1 -ml-2 rounded-r hover:bg-elevated/40 transition-colors',
          typeColor.border,
        )}
      >
        {/* Type badge */}
        <span className={cn(
          'text-[10px] px-1.5 py-0.5 rounded border capitalize whitespace-nowrap shrink-0',
          typeColor.badge,
        )}>
          {item.sessionType!.replace(/_/g, ' ')}
        </span>

        {/* Title */}
        <span className="text-xs text-primary group-hover:text-accent transition-colors truncate">
          {item.title ?? item.label}
        </span>

        {/* Dist / Dur */}
        <span className="text-[11px] text-muted whitespace-nowrap shrink-0 ml-auto">
          {item.distanceMiles ? `${item.distanceMiles} mi` : ''}
          {item.distanceMiles && item.durationMin ? ' / ' : ''}
          {item.durationMin ? `${item.durationMin} min` : ''}
          {isStrength && item.exerciseCount ? `${item.exerciseCount} exercises` : ''}
        </span>

        {/* Effort */}
        {item.effortLevel && (
          <span className="text-[10px] text-muted/70 truncate max-w-[100px] shrink-0 hidden sm:block" title={item.effortLevel}>
            {item.effortLevel}
          </span>
        )}
      </Link>
    )
  }

  // Simple item row (meals, trips, deadlines)
  const Icon = CATEGORY_ICONS[item.type]
  const categoryColors: Record<string, string> = {
    meals: 'text-accent',
    trip: 'text-accent',
    deadline: 'text-amber-500',
  }

  return (
    <Link
      href={item.href}
      className="flex items-start gap-2 group py-0.5"
    >
      <span className={cn(
        'inline-flex items-center gap-1 text-[10px] font-semibold uppercase shrink-0 mt-0.5',
        categoryColors[item.type] ?? 'text-muted',
      )}>
        <Icon className="h-3 w-3" />
        {item.type === 'meals' ? 'Meal' : item.type === 'trip' ? 'Hunt' : 'Deadline'}
      </span>
      <span className="text-xs text-secondary group-hover:text-accent transition-colors leading-tight">
        {item.label}
      </span>
    </Link>
  )
}

export function WeeklyPreview({ days, flexItems }: WeeklyPreviewProps) {
  const hasContent = days.some(d => d.items.length > 0) || flexItems.length > 0

  if (!hasContent) {
    return (
      <div className="rounded-lg border border-subtle bg-surface p-5">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="h-4 w-4 text-accent" />
          <h3 className="text-xs font-semibold text-muted uppercase tracking-wider">This Week</h3>
        </div>
        <p className="text-muted text-sm">Nothing scheduled this week</p>
      </div>
    )
  }

  // Show days that have items, plus today even if empty
  const visibleDays = days.filter(d => d.items.length > 0 || d.isToday)

  return (
    <div className="rounded-lg border border-subtle bg-surface p-5">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="h-4 w-4 text-accent" />
        <h3 className="text-xs font-semibold text-muted uppercase tracking-wider">This Week</h3>
      </div>

      <div className="space-y-0.5">
        {visibleDays.map(day => (
          <div
            key={day.date}
            className={cn(
              'flex gap-3 py-2 -mx-2 px-2 rounded',
              day.isToday && 'bg-accent/5 border border-accent/20'
            )}
          >
            {/* Day label */}
            <div className={cn('w-12 shrink-0 pt-0.5 text-center', day.isToday ? 'text-accent' : 'text-muted')}>
              <p className="text-[10px] font-semibold uppercase">{day.dayName}</p>
              <p className="text-sm font-bold">{day.dayNum}</p>
            </div>

            {/* Day's activities */}
            <div className="flex-1 min-w-0 space-y-1">
              {day.items.length === 0 && day.isToday && (
                <p className="text-muted text-xs italic pt-1">Rest day</p>
              )}
              {day.items.map((item, i) => (
                <SessionItem key={i} item={item} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Flexible items (e.g. weekly challenge — no specific day) */}
      {flexItems.length > 0 && (
        <div className="border-t border-subtle mt-3 pt-3">
          <p className="text-muted text-[10px] font-semibold uppercase tracking-wider mb-2">Anytime This Week</p>
          <div className="space-y-2">
            {flexItems.map((item, i) => {
              const Icon = CATEGORY_ICONS[item.type]
              return (
                <Link
                  key={i}
                  href={item.href}
                  className="flex items-start gap-2 group hover:bg-elevated -mx-2 px-2 py-1 rounded transition-colors"
                >
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase shrink-0 mt-0.5 text-amber-500">
                    <Icon className="h-3 w-3" />
                    Challenge
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs text-secondary group-hover:text-accent transition-colors">{item.title}</p>
                    <p className="text-muted text-[11px] mt-0.5">{item.subtitle}</p>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
