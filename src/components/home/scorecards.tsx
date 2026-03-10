import {
  Dumbbell, Target, GraduationCap, Flame, Users, MapPin, Activity, ClipboardList, Calendar,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ScorecardProps {
  icon: React.ElementType
  label: string
  value: string | number
  sub?: string
  accent?: boolean
}

function Scorecard({ icon: Icon, label, value, sub, accent }: ScorecardProps) {
  return (
    <div className="rounded-lg border border-subtle bg-surface p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={cn('h-4 w-4', accent ? 'text-accent' : 'text-muted')} />
        <span className="text-muted text-[10px] font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-primary text-2xl font-bold">{value}</p>
      {sub && <p className="text-muted text-xs mt-0.5">{sub}</p>}
    </div>
  )
}

interface BaselineBest {
  pushups: number
  situps: number
  pullups: number
  runTimeSeconds: number
}

interface ScorecardsProps {
  activeModules: number
  totalCourses: number
  completedCourses: number
  workoutsLogged: number
  activePlans: number
  upcomingTrips: number
  communityPosts: number
  baselineCount: number
  baselineBest: BaselineBest | null
  streak?: number
  nextTripDate?: string | null
  deadlinesThisWeek?: number
}

function formatRunTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr + 'T00:00:00')
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

export function Scorecards({
  activeModules,
  totalCourses,
  completedCourses,
  workoutsLogged,
  activePlans,
  upcomingTrips,
  communityPosts,
  baselineCount,
  baselineBest,
  streak = 0,
  nextTripDate,
  deadlinesThisWeek = 0,
}: ScorecardsProps) {
  const coursePct = totalCourses > 0 ? Math.round((completedCourses / totalCourses) * 100) : 0
  const totalActivity = workoutsLogged + baselineCount

  // Build fitness sub text
  let fitnessSub: string
  if (workoutsLogged > 0) {
    fitnessSub = `${activePlans} active plan${activePlans !== 1 ? 's' : ''}`
  } else if (baselineBest) {
    fitnessSub = `Best: ${baselineBest.pushups} PU / ${baselineBest.situps} SU / ${baselineBest.pullups} PU / ${formatRunTime(baselineBest.runTimeSeconds)} run`
  } else {
    fitnessSub = `${activePlans} active plan${activePlans !== 1 ? 's' : ''}`
  }

  // Dynamic cards — always show modules + courses, then the most relevant others
  const cards: ScorecardProps[] = [
    {
      icon: Target,
      label: 'Active Modules',
      value: activeModules,
      sub: 'of 6',
      accent: true,
    },
    {
      icon: GraduationCap,
      label: 'Courses',
      value: `${coursePct}%`,
      sub: `${completedCourses}/${totalCourses} complete`,
    },
  ]

  // Streak (if any)
  if (streak > 0) {
    cards.push({
      icon: Flame,
      label: 'Streak',
      value: streak,
      sub: `day${streak !== 1 ? 's' : ''} in a row`,
      accent: true,
    })
  }

  // Next hunt countdown
  if (nextTripDate) {
    const days = daysUntil(nextTripDate)
    cards.push({
      icon: Calendar,
      label: 'Next Hunt',
      value: days <= 0 ? 'Today!' : `${days}d`,
      sub: days <= 0 ? 'Hunt day' : 'until trip',
      accent: days <= 7,
    })
  }

  // Deadlines this week
  if (deadlinesThisWeek > 0) {
    cards.push({
      icon: ClipboardList,
      label: 'Deadlines',
      value: deadlinesThisWeek,
      sub: 'this week',
      accent: true,
    })
  }

  // Fitness activity
  if (totalActivity > 0 || activePlans > 0) {
    cards.push({
      icon: Activity,
      label: 'Fitness',
      value: totalActivity,
      sub: fitnessSub,
      accent: totalActivity > 0,
    })
  }

  // Upcoming trips (if not already shown via next hunt)
  if (upcomingTrips > 0 && !nextTripDate) {
    cards.push({
      icon: MapPin,
      label: 'Upcoming Trips',
      value: upcomingTrips,
      accent: true,
    })
  }

  // Community posts
  if (communityPosts > 0) {
    cards.push({
      icon: Users,
      label: 'Posts',
      value: communityPosts,
      sub: 'community',
    })
  }

  // Fallback: if only 2 cards, add plans
  if (cards.length <= 2) {
    cards.push({
      icon: Dumbbell,
      label: 'Active Plans',
      value: activePlans,
    })
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
      {cards.slice(0, 8).map((card, i) => (
        <Scorecard key={i} {...card} />
      ))}
    </div>
  )
}
